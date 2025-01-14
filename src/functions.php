<?php

namespace KokoAnalytics;

use WP_Query;

function maybe_collect_request() {
	// since we call this function (early) on every AJAX request, detect our specific request here
	// this allows us to short-circuit a bunch of unrelated AJAX stuff and gain a lot of performance
	if ( ! isset( $_GET['action'] ) || $_GET['action'] !== 'koko_analytics_collect' || ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) {
		return;
	}

	collect_request();
}

function collect_request() {
	$unique_visitor  = (int) $_GET['nv'];
	$unique_pageview = (int) $_GET['up'];
	$post_id         = (int) $_GET['p'];
	$referrer        = isset( $_GET['r'] ) ? trim( $_GET['r'] ) : '';

	collect_in_file( $post_id, $unique_visitor, $unique_pageview, $referrer );

	// set OK headers & prevent caching
	header( $_SERVER['SERVER_PROTOCOL'] . ' 200 OK' );
	header( 'Content-Type: image/gif' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Expires: Wed, 11 Jan 1984 05:00:00 GMT' );
	header( 'Cache-Control: no-cache, must-revalidate, max-age=0' );
	header_remove( 'Last-Modified' );

	// TODO: Determine whether we need to set origin headers and if we can do this without loading WordPress
	// send_origin_headers();

	// indicate that we are not tracking user specifically, see https://www.w3.org/TR/tracking-dnt/
	header( 'Tk: N' );

	// 1px transparent GIF, needs to be an actual image to make sure browser fires the onload event
	echo base64_decode( 'R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' );
	exit;
}

function collect_in_file( $post_id, $is_new_visitor, $is_unique_pageview, $referrer = '' ) {
	if ( defined( 'KOKO_ANALYTICS_BUFFER_FILE' ) ) {
		$filename = KOKO_ANALYTICS_BUFFER_FILE;
	} else {
		$uploads = wp_get_upload_dir();
		$filename = $uploads['basedir'] . '/pageviews.php';
	}

	$content = '';

	// if file does not yet exist, add PHP header to prevent direct file access
	if ( ! file_exists( $filename ) ) {
		$content = '<?php exit; ?>' . PHP_EOL;
	}

	// append data to file
	$line = join( ',', array( $post_id, $is_new_visitor, $is_unique_pageview, $referrer ) );
	$content .= $line . PHP_EOL;
	return file_put_contents( $filename, $content, FILE_APPEND );
}

function get_settings() {
	$default_settings = array(
		'exclude_user_roles' => array(),
		'prune_data_after_months' => 5 * 12, // 5 years
	);
	$settings = (array) get_option( 'koko_analytics_settings', array() );
	$settings = array_merge( $default_settings, $settings );
	return $settings;
}

function get_most_viewed_posts( array $args ) {
	global $wpdb;
	$default_args = array(
		'number'    => 5,
		'post_type' => 'post',
		'show_date' => false,
		'days'    => 30,
	);
	$args = array_merge( $default_args, $args );
	$start_date = gmdate( 'Y-m-d', strtotime( "-{$args['days']} days" ) );
	$end_date   = gmdate( 'Y-m-d', strtotime( 'tomorrow midnight' ) );
	$sql        = $wpdb->prepare( "SELECT p.id, SUM(visitors) As visitors, SUM(pageviews) AS pageviews FROM {$wpdb->prefix}koko_analytics_post_stats s JOIN {$wpdb->posts} p ON s.id = p.id WHERE s.date >= %s AND s.date <= %s AND p.post_type = %s AND p.post_status = 'publish' GROUP BY s.id ORDER BY pageviews DESC LIMIT 0, %d", array( $start_date, $end_date, $args['post_type'], $args['number'] ) );
	$results    = $wpdb->get_results( $sql );
	if ( empty( $results ) ) {
		return array();
	}

	$ids = wp_list_pluck( $results, 'id' );
	$r = new WP_Query(
		array(
			'posts_per_page'      => -1,
			'post__in'            => $ids,
			'orderby'             => 'post__in',
			'post_type'           => $args['post_type'],
			'no_found_rows'       => true,
			'ignore_sticky_posts' => true,
		)
	);
	return $r->posts;
}

function admin_bar_menu( $wp_admin_bar ) {
	// only show on frontend
	if ( is_admin() ) {
		return;
	}

	// only show for users who can access statistics page
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$wp_admin_bar->add_node(
		array(
			'parent' => 'site-name',
			'id' => 'koko-analytics',
			'title' => __( 'Analytics', 'koko-analytics' ),
			'href' => admin_url( '/index.php?page=koko-analytics' ),
		)
	);
}

function widgets_init() {
	require __DIR__ . '/class-widget-most-viewed-posts.php';
	register_widget( 'KokoAnalytics\Widget_Most_Viewed_Posts' );
}
