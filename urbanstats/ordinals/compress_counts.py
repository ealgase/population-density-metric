from produce_html_page import statistic_internal_to_display_name


def compress_counts_sequence(counts):
    """
    Take a sequence like [50, 50, 50, 32, 32, 64] and compress it into
        [[50, 3], [32, 2], [64, 1]]
    """
    result = []
    for c in counts:
        if not result or result[-1][0] != c:
            result.append([c, 1])
        else:
            result[-1][1] += 1
    return result


def compress_counts(counts):
    statcols = list(statistic_internal_to_display_name())
    counts_new = {}
    for k in counts:
        counts_for_universe = {}
        for (column, typ), count in counts[k]:
            column = tuple(column) if isinstance(column, list) else column
            if typ not in counts_for_universe:
                counts_for_universe[typ] = {}
            counts_for_universe[typ][column] = count
        counts_for_universe = {
            typ: compress_counts_sequence(
                [counts_for_universe[typ][col] for col in statcols]
            )
            for typ in counts_for_universe
        }
        counts_new[k] = counts_for_universe
    return counts_new


def mapify(lst):
    result = {}
    for (a, b, c), v in lst:
        result[f"{a}__{b}__{c}"] = v
    return result
