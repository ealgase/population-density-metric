export { PageTemplate };

import React from 'react';

import { Header } from "../components/header.js";
import { Sidebar } from "../components/sidebar.js";
import "../common.css";
import "../components/article.css";
import { loadJSON } from '../load_json.js';
import { relationship_key } from '../components/related-button.js';

class PageTemplate extends React.Component {
    constructor(props) {
        super(props);
        // backed by local storage
        let settings = JSON.parse(localStorage.getItem("settings")) || {};
        const map_relationship = loadJSON("/index/map_relationship.json");
        for (let i in map_relationship) {
            const key = relationship_key(map_relationship[i][0], map_relationship[i][1]);
            if (!(key in settings)) {
                settings[key] = true;
            }
        }
        this.state = {
            settings: settings
        }
    }

    render() {
        const self = this;
        return (
            <div className="main_panel">
                <Header settings={this.state.settings} />
                <div className="gap"></div>
                <div className="body_panel">
                    <div className="left_panel">
                        <Sidebar
                            shortname={this.props.shortname}
                            source={this.props.source}
                            settings={this.state.settings}
                            set_setting={(key, value) => self.set_setting(key, value)} />
                    </div>
                    <div className="right_panel">
                        {this.main_content()}
                        <div className="gap"></div>
                        <div className="centered_text">Urban Stats Version 2.4.0 by Kavi Gupta. Last updated 2023-07-07.</div>
                    </div>
                </div>
            </div>
        );
    }

    set_setting(key, value) {
        let settings = this.state.settings;
        settings[key] = value;
        this.setState({ settings: settings });
        localStorage.setItem("settings", JSON.stringify(settings));
    }

    main_content() {
        // not implemented, should be overridden
        return (<div></div>);
    }
}
