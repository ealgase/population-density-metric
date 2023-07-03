import React from 'react';

export { StatisticRowRaw };
import { article_link } from "../navigation/links.js";
import "./table.css";


class StatisticRowRaw extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <tr className={this.props.is_header ? "tableheader" : this.props.index % 2 == 1 ? "oddrow" : ""}>
                <td style={{ width: "31%" }}>
                    <span className="serif value">{
                        this.props.is_header ? "Statistic" : this.props.statname}
                    </span>
                </td>
                <td className="value_numeric" style={{ width: "10%" }}>
                    <span className="serif value">{
                        this.props.is_header
                            ? "Value"
                            : <Statistic statname={this.props.statname} value={this.props.statval} is_unit={false} settings={this.props.settings} />}</span>
                </td>
                <td className="value_unit" style={{ width: "5%" }}>
                    <span className="serif value">{
                        this.props.is_header
                            ? ""
                            : <Statistic statname={this.props.statname} value={this.props.statval} is_unit={true} settings={this.props.settings}/>}</span>
                </td>
                <td style={{ width: "25%" }}>
                    <span className="serif ordinal">{
                        this.props.is_header
                            ? "Ordinal"
                            : <Ordinal ordinal={this.props.ordinal}
                                total={this.props.total_in_class}
                                type={this.props.row_type} />
                    }</span>
                </td>
                <td style={{ width: "17%" }}>
                    <span className="serif ordinal">{
                        this.props.is_header
                            ? "Percentile"
                            : <Percentile ordinal={this.props.ordinal}
                                total={this.props.total_in_class} />
                    }</span>
                </td>
                <td style={{ width: "8%" }}>
                    <span className="serif ordinal">{
                        this.props.is_header
                            ? "Within Type"
                            : <PointerButtons pointers={this.props.ba_within_type} />}</span>
                </td>
                <td style={{ width: "8%" }}>
                    <span className="serif ordinal">{
                        this.props.is_header
                            ? "Overall"
                            : <PointerButtons pointers={this.props.ba_overall} />}</span>
                </td>
            </tr>
        );
    }
}


class Statistic extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const name = this.props.statname;
        let value = this.props.value;
        const is_unit = this.props.is_unit;
        if (name.includes("Density")) {
            const is_imperial = this.props.settings.use_imperial;
            let unit_name = "km";
            if (is_imperial) {
                unit_name = "mi";
                value *= 1.60934 * 1.60934;
            }
            let places = 2;
            if (value > 10) {
                places = 0;
            } else if (value > 1) {
                places = 1;
            }
            if (is_unit) {
                return <span>/&nbsp;{unit_name}<sup>2</sup></span>;
            }
            return <span>{value.toFixed(places)}</span>;
        } else if (name == "Population") {
            if (value > 1e6) {
                if (is_unit) {
                    return <span>m</span>;
                }
                return <span>{(value / 1e6).toFixed(1)}</span>;
            } else if (value > 1e3) {
                if (is_unit) {
                    return <span>k</span>;
                }
                return <span>{(value / 1e3).toFixed(1)}</span>;
            } else {
                if (is_unit) {
                    return <span></span>;
                }
                return <span>{value.toFixed(0)}</span>;
            }
        } else if (name.includes("%")) {
            if (is_unit) {
                return <span>%</span>;
            }
            return <span>{(value * 100).toFixed(2)}</span>;
        } else if (name.includes("Election")) {
            if (is_unit) {
                return <span>%</span>;
            }
            return <ElectionResult value={value} />;
        }
        if (is_unit) {
            return <span></span>;
        }
        return <span>{value.toFixed(3)}</span>;
    }
}

class ElectionResult extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        // check if value is NaN
        if (this.props.value != this.props.value) {
            return <span>N/A</span>;
        }
        const value = Math.abs(this.props.value) * 100;
        const places = value > 10 ? 1 : value > 1 ? 2 : value > 0.1 ? 3 : 4;
        const text = value.toFixed(places);
        const party = this.props.value > 0 ? "D" : "R";
        return <span className={"party_result_" + party}>{party}+{text}</span>;
    }
}

class Ordinal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const ordinal = this.props.ordinal;
        const total = this.props.total;
        const type = this.props.type;
        return <span>{ordinal} of {total} {this.pluralize(type)}</span>;
    }

    pluralize(type) {
        if (type.endsWith("y")) {
            return type.slice(0, -1) + "ies";
        }
        return type + "s";
    }
}

class Percentile extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const ordinal = this.props.ordinal;
        const total = this.props.total;
        // percentile as an integer
        const percentile = Math.floor(100 - 100 * ordinal / total);
        // something like Xth percentile
        let text = percentile + "th percentile";
        if (percentile % 10 == 1 && percentile % 100 != 11) {
            text = percentile + "st percentile";
        } else if (percentile % 10 == 2 && percentile % 100 != 12) {
            text = percentile + "nd percentile";
        } else if (percentile % 10 == 3 && percentile % 100 != 13) {
            text = percentile + "rd percentile";
        }
        return <span>{text}</span>;
    }
}

class PointerButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <span>
                <PointerButton text="<" longname={this.props.pointers[0]} />
                <PointerButton text=">" longname={this.props.pointers[1]} />
            </span>
        );
    }
}

class PointerButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.longname == null) {
            return <span className="button">&nbsp;&nbsp;</span>
        } else {
            return <a className="button" href={article_link(this.props.longname)}>{this.props.text}</a>
        }
    }
}
