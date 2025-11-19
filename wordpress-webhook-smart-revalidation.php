<?php
/**
 * ИНТЕЛИГЕНТНА VERCEL REVALIDATION
 * 
 * Ревалидира САМО променените страници:
 * - При промяна на продукт → продуктовата страница + категориите му
 * - При промяна на категория → категорийната страница + подкатегории
 * - При промяна на етикет → етикетната страница
 * 
 * Добави този код във functions.php на WordPress темата.
 */

// Конфигурация
define('VERCEL_REVALIDATE_URL', 'https://leaderfitness.net/api/revalidate');
define('VERCEL_REVALIDATE_SECRET', 'ТВОЯТ_SECRET_ТУК'); // Генериран с PowerShell

/**
 * Изпраща revalidation заявка към Vercel
 */
function send_vercel_revalidation($paths) {
    if (empty($paths)) {
        return;
    }

    $body = json_encode([
        'secret' => VERCEL_REVALIDATE_SECRET,
        'paths' => array_unique($paths) // Премахва дублирани пътища
    ]);

    $args = [
        'body' => $body,
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'timeout' => 10,
        'blocking' => false, // Не чака отговор - бързо!
    ];

    wp_remote_post(VERCEL_REVALIDATE_URL, $args);
    
    // Лог за debug (опционално)
    error_log('🔄 Vercel revalidation: ' . implode(', ', $paths));
}

/**
 * Hook 1: Промяна на ПРОДУКТ
 */
add_action('save_post_product', function($post_id, $post) {
    // Игнорирай auto-saves и drafts
    if (wp_is_post_autosave($post_id) || $post->post_status !== 'publish') {
        return;
    }

    $paths = [];

    // 1. Продуктовата страница
    $product_slug = $post->post_name;
    $paths[] = "/produkt/{$product_slug}";

    // 2. Категориите на продукта
    $categories = wp_get_post_terms($post_id, 'product_cat', ['fields' => 'all']);
    foreach ($categories as $category) {
        $category_slug = $category->slug;
        
        // Главна категория
        if ($category->parent == 0) {
            $paths[] = "/produkt-kategoriya/{$category_slug}";
        } else {
            // Подкатегория - намери родителя
            $parent = get_term($category->parent, 'product_cat');
            if ($parent && !is_wp_error($parent)) {
                $paths[] = "/produkt-kategoriya/{$parent->slug}/{$category_slug}";
            }
        }
    }

    // 3. Етикетите на продукта
    $tags = wp_get_post_terms($post_id, 'product_tag', ['fields' => 'slugs']);
    foreach ($tags as $tag_slug) {
        $paths[] = "/produkt-etiket/{$tag_slug}";
    }

    // 4. Марката на продукта (ако има)
    $brands = wp_get_post_terms($post_id, 'pa_brands', ['fields' => 'slugs']);
    foreach ($brands as $brand_slug) {
        $paths[] = "/marka-produkt/{$brand_slug}";
    }

    send_vercel_revalidation($paths);
}, 10, 2);

/**
 * Hook 2: Промяна на КАТЕГОРИЯ
 */
add_action('edited_product_cat', function($term_id) {
    $term = get_term($term_id, 'product_cat');
    if (is_wp_error($term)) {
        return;
    }

    $paths = [];

    // 1. Самата категория
    if ($term->parent == 0) {
        $paths[] = "/produkt-kategoriya/{$term->slug}";
    } else {
        $parent = get_term($term->parent, 'product_cat');
        if ($parent && !is_wp_error($parent)) {
            $paths[] = "/produkt-kategoriya/{$parent->slug}/{$term->slug}";
            // Ревалидирай и родителската категория
            $paths[] = "/produkt-kategoriya/{$parent->slug}";
        }
    }

    // 2. Подкатегориите (ако има)
    $children = get_terms([
        'taxonomy' => 'product_cat',
        'parent' => $term_id,
        'hide_empty' => false,
    ]);
    foreach ($children as $child) {
        $paths[] = "/produkt-kategoriya/{$term->slug}/{$child->slug}";
    }

    send_vercel_revalidation($paths);
});

/**
 * Hook 3: Промяна на ЕТИКЕТ
 */
add_action('edited_product_tag', function($term_id) {
    $term = get_term($term_id, 'product_tag');
    if (is_wp_error($term)) {
        return;
    }

    $paths = ["/produkt-etiket/{$term->slug}"];
    send_vercel_revalidation($paths);
});

/**
 * Hook 4: Промяна на МАРКА (pa_brands атрибут)
 */
add_action('edited_pa_brands', function($term_id) {
    $term = get_term($term_id, 'pa_brands');
    if (is_wp_error($term)) {
        return;
    }

    $paths = ["/marka-produkt/{$term->slug}"];
    send_vercel_revalidation($paths);
});

/**
 * Hook 5: Изтриване на продукт (опционално)
 */
add_action('before_delete_post', function($post_id) {
    $post = get_post($post_id);
    if ($post && $post->post_type === 'product') {
        // Ревалидирай категориите преди да се изтрие продукта
        $categories = wp_get_post_terms($post_id, 'product_cat', ['fields' => 'all']);
        $paths = [];
        
        foreach ($categories as $category) {
            if ($category->parent == 0) {
                $paths[] = "/produkt-kategoriya/{$category->slug}";
            } else {
                $parent = get_term($category->parent, 'product_cat');
                if ($parent && !is_wp_error($parent)) {
                    $paths[] = "/produkt-kategoriya/{$parent->slug}/{$category->slug}";
                }
            }
        }
        
        send_vercel_revalidation($paths);
    }
});

/**
 * БОНУС: Масова ревалидация (за admin панел)
 * Достъпен на: /wp-admin/admin-ajax.php?action=vercel_revalidate_all
 */
add_action('wp_ajax_vercel_revalidate_all', function() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    $paths = [
        '/', // Начална страница
        '/produkt-kategoriya', // Всички категории (index)
    ];

    send_vercel_revalidation($paths);
    wp_send_json_success(['message' => 'Revalidation started for ' . count($paths) . ' paths']);
});

