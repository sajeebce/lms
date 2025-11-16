<?php
/**
 * Plugin Name: Texril Editor
 * Description: Embed your hosted Texril rich text editor into WordPress via shortcode.
 * Version: 0.1.0
 * Author: Texril
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function texril_editor_add_settings_page() {
	add_options_page(
		'Texril Editor',
		'Texril Editor',
		'manage_options',
		'texril-editor',
		'texril_editor_render_settings_page'
	);
}
add_action( 'admin_menu', 'texril_editor_add_settings_page' );

function texril_editor_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( 'POST' === $_SERVER['REQUEST_METHOD'] && check_admin_referer( 'texril_editor_save_settings' ) ) {
		update_option( 'texril_editor_api_key', sanitize_text_field( $_POST['texril_editor_api_key'] ?? '' ) );
		update_option( 'texril_editor_tenant_id', sanitize_text_field( $_POST['texril_editor_tenant_id'] ?? '' ) );
		update_option( 'texril_editor_base_url', esc_url_raw( $_POST['texril_editor_base_url'] ?? '' ) );
	}

	$api_key   = get_option( 'texril_editor_api_key', '' );
	$tenant_id = get_option( 'texril_editor_tenant_id', '' );
	$base_url  = get_option( 'texril_editor_base_url', 'http://localhost:3000' );
	?>
	<div class="wrap">
		<h1>Texril Editor</h1>
		<p>Configure the connection to your hosted Texril editor.</p>
		<form method="post">
			<?php wp_nonce_field( 'texril_editor_save_settings' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="texril_editor_api_key">API Key</label>
					</th>
					<td>
						<input
							type="text"
							class="regular-text"
							id="texril_editor_api_key"
							name="texril_editor_api_key"
							value="<?php echo esc_attr( $api_key ); ?>"
						/>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="texril_editor_tenant_id">Tenant ID</label>
					</th>
					<td>
						<input
							type="text"
							class="regular-text"
							id="texril_editor_tenant_id"
							name="texril_editor_tenant_id"
							value="<?php echo esc_attr( $tenant_id ); ?>"
						/>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="texril_editor_base_url">Texril Base URL</label>
					</th>
					<td>
						<input
							type="url"
							class="regular-text"
							id="texril_editor_base_url"
							name="texril_editor_base_url"
							value="<?php echo esc_attr( $base_url ); ?>"
						/>
						<p class="description">
							Example: http://localhost:3000 for local dev or https://app.yourdomain.com in production.
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

function texril_editor_shortcode( $atts = array(), $content = '' ) {
	$api_key   = get_option( 'texril_editor_api_key', '' );
	$tenant_id = get_option( 'texril_editor_tenant_id', '' );
	$base_url  = rtrim( get_option( 'texril_editor_base_url', '' ), '/' );

	if ( empty( $api_key ) || empty( $base_url ) ) {
		return '<div class="texril-editor-warning">Texril Editor: API key or base URL not configured.</div>';
	}

	$domain   = $_SERVER['HTTP_HOST'] ?? '';
	$endpoint = $base_url . '/api/license/validate';

	$body = array(
		'apiKey'   => $api_key,
		'tenantId' => $tenant_id,
		'domain'   => $domain,
	);

	$response = wp_remote_post(
		$endpoint,
		array(
			'headers' => array(
				'Content-Type' => 'application/json',
			),
			'body'    => wp_json_encode( $body ),
			'timeout' => 8,
		)
	);

	$allowed   = false;
	$embed_url = '';

	if ( ! is_wp_error( $response ) ) {
		$code = wp_remote_retrieve_response_code( $response );
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( 200 === $code && ! empty( $data['allowed'] ) ) {
			$allowed   = true;
			$embed_url = ! empty( $data['embedUrl'] ) ? $data['embedUrl'] : '';
		}
	}

	if ( ! $allowed || empty( $embed_url ) ) {
		return '<div class="texril-editor-warning">Texril Editor: license is not active or Texril app is unreachable.</div>';
	}

	$embed_url = esc_url( $embed_url );
	$style     = 'width:100%;min-height:500px;border:1px solid #e5e7eb;border-radius:8px;';

	return '<iframe src="' . $embed_url . '" style="' . esc_attr( $style ) . '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
}
add_shortcode( 'texril_editor', 'texril_editor_shortcode' );

