'use strict';

import React from 'react';
import {format} from "date-fns";
import '../../sass/totals.scss';
import numbers from '../util/numbers.js';
import api from '../util/api.js';
const i18n = window.koko_analytics.i18n;
const now = new Date();

export default class Totals extends React.PureComponent {

	constructor(props) {
		super(props);
		this.state = {
			visitors: 0,
			visitorsChange: 0,
			visitorsDiff: 0,
			visitorsPrevious: 0,
			pageviews: 0,
			pageviewsChange: 0,
			pageviewsDiff: 0,
			pageviewsPrevious: 0,
		}
	}

	componentDidMount() {
		this.fetch();
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (this.props.startDate.getTime() === prevProps.startDate.getTime() && this.props.endDate.getTime() === prevProps.endDate.getTime()) {
			return;
		}

		this.fetch();
	}

	fetch() {
		let s = this.props.startDate;
		// if end date is in future, use today instead so we get a fair comparison
		let e = this.props.endDate.getTime() <= now.getTime() ? this.props.endDate : now;
		let diff = (e.getTime() - s.getTime()) - 1;
		let previousStartDate = new Date(s.getTime() - diff);
		let previousEndDate = new Date(e.getTime() - diff);

		let visitors = 0;
		let pageviews = 0;
		let visitorsChange = 0;
		let pageviewsChange = 0;
		let visitorsDiff = 0;
		let pageviewsDiff = 0;
		let visitorsPrevious = 0;
		let pageviewsPrevious = 0;

		Promise.all([
			// 1
			api.request(`/stats`, {
				body: {
					start_date: format(this.props.startDate, 'yyyy-MM-dd'),
					end_date: format(this.props.endDate, 'yyyy-MM-dd')
				}
			}).then(data => {
				data.forEach(r => {
					visitors += parseInt(r.visitors);
					pageviews += parseInt(r.pageviews);
				});
			}),

			// 2
			api.request(`/stats`, {
				body: {
					start_date: format(previousStartDate, 'yyyy-MM-dd'),
					end_date: format(previousEndDate, 'yyyy-MM-dd')
				}
			}).then(data => {
				data.forEach(r => {
					visitorsPrevious += parseInt(r.visitors);
					pageviewsPrevious += parseInt(r.pageviews);
				});
			})
		]).then(() => {
			if (visitorsPrevious > 0) {
				visitorsDiff = visitors - visitorsPrevious;
				visitorsChange = Math.round((visitors / visitorsPrevious - 1) * 100);
			}

			if (pageviewsPrevious > 0) {
				pageviewsDiff = pageviews - pageviewsPrevious;
				pageviewsChange = Math.round((pageviews / pageviewsPrevious - 1) * 100);
			}

			this.setState({visitors, visitorsPrevious, visitorsDiff, visitorsChange, pageviews, pageviewsPrevious, pageviewsDiff, pageviewsChange});
		});
	}

	render() {
		let {visitors, visitorsPrevious, visitorsDiff, visitorsChange, pageviews, pageviewsPrevious, pageviewsDiff, pageviewsChange} = this.state;

		return (
			<div className="totals-container">
				<div className="totals-box fade">
					<div className="totals-label">{i18n['Total visitors']}</div>
					<div className="totals-amount">{numbers.formatPretty(visitors)} <span
						className={visitorsChange > 0 ? "up" : visitorsChange === 0 ? "neutral" : "down"}>{numbers.formatPercentage(visitorsChange)}</span>
					</div>
					<div className="totals-compare">
						<span>{numbers.formatPretty(Math.abs(visitorsDiff))} {visitorsDiff > 0 ? "more" : "less"} than previous period</span>
					</div>
				</div>
				<div className="totals-box fade">
					<div className="totals-label">{i18n['Total pageviews']}</div>
					<div className="totals-amount">{numbers.formatPretty(pageviews)} <span
						className={pageviewsChange > 0 ? "up" : pageviewsChange === 0 ? "neutral" : "down"}>{numbers.formatPercentage(pageviewsChange)}</span>
					</div>
					<div className="totals-compare">
						<span>{numbers.formatPretty(Math.abs(pageviewsDiff))} {pageviewsDiff > 0 ? "more" : "less"} than previous period</span>
					</div>
				</div>
			</div>
		)
	}
}

