import "@fontsource/jost/100.css";
import "@fontsource/jost/200.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/jost/800.css";
import "@fontsource/jost/900.css";

export { PageTemplate };

import React, { Fragment } from 'react';

import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import "../common.css";
import "../components/article.css";
import { load_settings } from './settings.js';
import { mobileLayout } from '../utils/responsive';
import { create_screenshot } from '../components/screenshot';
import { set_universe } from '../universe';


class PageTemplate extends React.Component {
    constructor(props) {
        super(props);

        const [settings, statistic_category_metadata_checkboxes] = load_settings();

        this.statistic_category_metadata_checkboxes = statistic_category_metadata_checkboxes;

        // get from url field
        this.set_universe = universe => {
            this.setState({ current_universe: universe });
            set_universe(universe);
        }

        this.all_universes = this.props.universes;

        this.state = {
            settings: settings,
            hamburger_open: false,
            screenshot_mode: false,
            current_universe: this.props.universe,
        }
    }

    render() {
        const self = this;
        return (
            <Fragment>
                <meta name="viewport" content="width=600" />
                <div className={mobileLayout() ? "main_panel_mobile" : "main_panel"}>
                    <Header
                        settings={this.state.settings}
                        hamburger_open={this.state.hamburger_open}
                        set_hamburger_open={x => this.setState({ hamburger_open: x })}
                        has_screenshot={this.has_screenshot_button()}
                        has_universe_selector={this.has_universe_selector()}
                        current_universe={this.state.current_universe}
                        all_universes={this.all_universes}
                        on_universe_update={universe => this.set_universe(universe)}
                        screenshot_mode={this.state.screenshot_mode}
                        initiate_screenshot={() => this.initiate_screenshot()}
                    />
                    <div style={{marginBlockEnd: "16px"}}></div>
                    {this.bodyPanel()}
                </div>
            </Fragment>
        );
    }

    bodyPanel() {
        if (this.state.hamburger_open) {
            return this.leftPanel();
        }
        return <div className="body_panel">
            {mobileLayout() ? undefined : this.leftPanel()}
            <div className={mobileLayout() ? "content_panel_mobile" : "right_panel"}>
                {this.main_content()}
                <div className="gap"></div>
                <TemplateFooter />
            </div>
        </div>
    }

    leftPanel() {
        const self = this;
        return (
            <div className={mobileLayout() ? "left_panel_mobile" : "left_panel"}>
                <Sidebar
                    shortname={this.props.shortname}
                    source={this.props.source}
                    settings={this.state.settings}
                    set_setting={(key, value) => self.set_setting(key, value)}
                    statistic_category_metadata_checkboxes={this.statistic_category_metadata_checkboxes} />
            </div>
        )
    }

    set_setting(key, value) {
        let settings = this.state.settings;
        settings[key] = value;
        this.setState({ settings: settings });
        localStorage.setItem("settings", JSON.stringify(settings));
    }

    has_screenshot_button() {
        return false;
    }

    has_universe_selector() {
        return false;
    }

    screencap_elements() {
        // not implemented, should be overridden
        return {
            path: undefined,
            overall_width: undefined,
            elements_to_render: undefined,
        }
    }

    async screencap() {
        const config = this.screencap_elements();

        try {
            console.log("Creating screenshot...");
            await create_screenshot(config, this.has_universe_selector() ? this.state.current_universe : undefined);
        } catch (e) {
            console.error(e);
        }
    }

    async initiate_screenshot() {
        this.setState({ screenshot_mode: true });
        setTimeout(async () => {
            await this.screencap();
            this.setState({ screenshot_mode: false });
        })
    }

    main_content() {
        // not implemented, should be overridden
        return (<div></div>);
    }
}

function TemplateFooter() {
    return <div className="centered_text">
        Urban Stats Version <Version /> by <MainCredits />. Last updated <LastUpdated />. <OtherCredits /> Not for commercial use.
    </div>
}

function Version() {
    return <span id="current-version">16.6.0</span>
}

function LastUpdated() {
    return <span id="last-updated">2024-07-21</span>
}

function MainCredits() {
    return <span id="main-credits">Kavi Gupta and Luke Brody</span>
}

function OtherCredits() {
    return <span>
        Significant help with weather data from <a href="https://twitter.com/OklahomaPerson">OklahomaPerson</a>.
    </span>
}