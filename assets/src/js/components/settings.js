'use strict';

import React from 'react';
import api from './../util/api.js';

const i18n = window.koko_analytics.i18n;
const roles = window.koko_analytics.user_roles;
const settings = window.koko_analytics.settings;
import Nav from './nav.js';

export default class Settings extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			settings,
			saving: false,
			buttonText: i18n['Save Changes'],
		};

		this.onSubmit = this.onSubmit.bind(this);
	}

	onSubmit(evt) {
		evt.preventDefault();

		this.setState({
			saving: true,
			buttonText: i18n['Saving - please wait']
		});
		let startTime = new Date();

		api.request("/settings", {
			method: "POST",
			body: settings
		}).then(success => {
			window.setTimeout(() => {
				this.setState({
					buttonText: i18n['Saved!'],
				});
			}, Math.max(20, 400 - (+new Date() - startTime)));
		}).finally(() => {

			this.setState({
				saving: false
			});

			window.setTimeout(() => {
				this.setState({
					buttonText: i18n['Save Changes']
				});
			}, 4000);
		});
	}

	render() {
		let {saving, buttonText, settings} = this.state;
		return (
			<main>
				<div className={"grid"}>
					<div className={"four"}>
						<h1>{i18n['Settings']}</h1>
						<form method={"POST"} onSubmit={this.onSubmit}>
							<div className={"input-group"}>
								<label>{i18n['Exclude pageviews from these user roles']}</label>
								<select name="exclude_user_roles[]" multiple={true} value={settings.exclude_user_roles} onChange={(evt) => {
									settings.exclude_user_roles = [].filter.call(evt.target.options, el => el.selected).map(el => el.value);
									this.setState({settings});
								}}>
									{Object.keys(roles).map(key => {
										return (<option key={key} value={key}>{roles[key]}</option>)
									})}
								</select>
								<p className={"help"}>{i18n['Visits and pageviews from users with any of the selected roles will be ignored.']}</p>
							</div>

							<div className={"input-group"}>
								<label>{i18n['Automatically delete data older than how many months?']}</label>
								<input type={"number"} value={settings.prune_data_after_months} onChange={(evt) => {
									settings.prune_data_after_months = parseInt(evt.target.value);
									this.setState({settings});
								}} step={1} min={0} max={600} /> {i18n['months']}
								<p className={"help"}>{i18n['Statistics older than the number of months configured here will automatically be deleted. Set to 0 to disable.']}</p>
							</div>

							<p>
								<button type={"submit"} className={"button button-primary"}
										disabled={saving}>{buttonText}</button>
							</p>
						</form>
					</div>
					<Nav />
				</div>
			</main>
		)
	}

}
