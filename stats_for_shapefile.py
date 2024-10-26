import pickle
from collections import Counter
from functools import lru_cache
import re

import attr
import geopandas as gpd
import pandas as pd
import tqdm.auto as tqdm
from permacache import permacache, stable_hash

from urbanstats.statistics.collections_list import statistic_collections


@attr.s
class Shapefile:
    hash_key = attr.ib()
    path = attr.ib()
    shortname_extractor = attr.ib()
    longname_extractor = attr.ib()
    filter = attr.ib()
    meta = attr.ib()
    drop_dup = attr.ib(default=False)
    chunk_size = attr.ib(default=None)
    american = attr.ib(default=True)
    include_in_gpw = attr.ib(default=False)
    tolerate_no_state = attr.ib(default=False)

    def load_file(self):
        if isinstance(self.path, list):
            s = gpd.GeoDataFrame(pd.concat([gpd.read_file(p) for p in self.path]))
            s = s.reset_index(drop=True)
        elif isinstance(self.path, str):
            if self.path.endswith(".pkl"):
                with open(self.path, "rb") as f:
                    s = pickle.load(f).reset_index(drop=True)
            else:
                s = gpd.read_file(self.path)
        else:
            s = self.path()
        s = s[s.apply(self.filter, axis=1)]
        s = gpd.GeoDataFrame(
            dict(
                shortname=s.apply(self.shortname_extractor, axis=1),
                longname=s.apply(self.longname_extractor, axis=1),
            ),
            geometry=s.geometry,
        )
        if self.drop_dup:
            longname_to_indices = (
                s["longname"]
                .reset_index(drop=True)
                .reset_index()
                .groupby("longname")["index"]
                .apply(list)
                .to_dict()
            )
            duplicates = {k: v for k, v in longname_to_indices.items() if len(v) > 1}
            if self.drop_dup is True:
                s = s[s.longname.apply(lambda x: x not in duplicates)]
            else:
                s = drop_duplicate(s, duplicates, self.drop_dup)
        if s.crs is None:
            s.crs = "EPSG:4326"
        s = s.to_crs("EPSG:4326")
        return s


@lru_cache(None)
def load_shapefile_cached(drop_dup_shapefile_key):
    from shapefiles import shapefiles

    return shapefiles[drop_dup_shapefile_key].load_file()


def shapefile_hash_key(sf_key):
    from shapefiles import shapefiles

    return shapefiles[sf_key].hash_key


@permacache(
    "stats_for_shapefile/locate_rows_3",
    key_function=dict(
        shape=lambda g: stable_hash(g.__geo_interface__),
        shapefile_key=shapefile_hash_key,
    ),
)
def locate_rows(shape, shapefile_key):
    shapefile = load_shapefile_cached(shapefile_key)
    result = shapefile[
        shapefile.apply(lambda x: x.geometry.intersects(shape), axis=1)
    ].copy()
    result["overlap_area"] = result.apply(
        lambda x: x.geometry.intersection(shape).area, axis=1
    )
    result["overlap_pct"] = result.overlap_area / shape.area
    return result


def remove_total_duplicates(s, indices):
    first_row = s.iloc[indices[0]]
    hash_geo = stable_hash(first_row.geometry.__geo_interface__)
    kept = [indices[0]]
    duplicates = []
    for idx in indices[1:]:
        if stable_hash(s.iloc[idx].geometry.__geo_interface__) == hash_geo:
            duplicates.append(idx)
        else:
            kept.append(idx)
    return kept, duplicates


def drop_duplicate(s, duplicates, drop_dup_shapefile_key):
    from urbanstats.data.circle import naive_directions_for_rows_with_names

    all_delete_indices = set()
    for longname, indices in tqdm.tqdm(list(duplicates.items())):
        indices, delete_indices = remove_total_duplicates(s, indices)
        all_delete_indices.update(delete_indices)
        if len(indices) == 1:
            continue
        addtl_name_each = [
            compute_additional_name(s.iloc[idx].geometry, drop_dup_shapefile_key)
            for idx in indices
        ]
        addtl_name_each = naive_directions_for_rows_with_names(
            s.iloc[indices], addtl_name_each
        )
        for addtl_name, idx in zip(addtl_name_each, indices):
            new_longname = compute_new_longname(
                addtl_name, longname, s.iloc[idx].shortname
            )
            s.loc[idx, "longname"] = new_longname
    s = s.drop(index=all_delete_indices).reset_index(drop=True)
    return s


def compute_new_longname(addtl_name, longname, shortname):
    if longname.startswith(shortname):
        new_longname = f"{shortname} ({addtl_name}){longname[len(shortname):]}"
    elif "Neighborhood" in longname:
        pre_neighborhood, post_neighborhood = longname.split(" Neighborhood")
        new_longname = (
            f"{pre_neighborhood} Neighborhood ({addtl_name}){post_neighborhood}"
        )
    else:
        raise ValueError(f"Unparseable longname {longname}")
    return new_longname


def compute_additional_name(geometry, drop_dup_shapefile_key):
    counties_in = locate_rows(geometry, drop_dup_shapefile_key)[
        ["longname", "shortname", "overlap_pct"]
    ].copy()
    counties_in.sort_values("overlap_pct", inplace=True, ascending=False)
    account_for = 0
    relevant = []
    for _, row in counties_in.iterrows():
        relevant.append(strip_suffix(row.shortname))
        account_for += row.overlap_pct
        if account_for >= 0.99:
            break
    return "-".join(relevant)


def strip_suffix(name):
    if name in {
        "District of Columbia",
        "Township 1, Charlotte",
        "Township 12, Paw Creek",
    } or re.match(r"^District \d+$", name):
        return name
    suffixes = [
        " county",
        " parish",
        " borough",
        " census area",
        " municipio",
        " city",
        " planning region",
        " city-county",
        " ccd",
        " township",
        " district",
        " town",
        " barrio",
    ]
    for suffix in suffixes:
        if name.lower().endswith(suffix.lower()):
            return name[: -len(suffix)]
    raise ValueError(f"Unknown suffix in {name}")


@permacache(
    "population_density/stats_for_shapefile/compute_statistics_for_shapefile_24",
    key_function=dict(sf=lambda x: x.hash_key, statistic_collections=stable_hash),
    multiprocess_safe=True,
)
def compute_statistics_for_shapefile(sf, statistic_collections=statistic_collections):
    sf_fr = sf.load_file()
    print(sf)
    result = sf_fr[["shortname", "longname"]].copy()
    result["area"] = sf_fr["geometry"].to_crs({"proj": "cea"}).area / 1e6
    assert (result.longname == sf_fr.longname).all()
    for k in sf.meta:
        result[k] = sf.meta[k]

    for collection in statistic_collections:
        if collection.for_america():
            collection.compute_statistics(sf, result, sf_fr)

    return result
