export default {
    important: '#livey-widget',  // Scope ALL Tailwind to widget container
    content: ['./src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                'livey-primary': '#2563eb',    // Blue-600 (brand)
                'livey-success': '#16a34a',    // Green-600
                'livey-danger': '#dc2626',     // Red-600
                'livey-seller': '#2563eb',     // Seller chat bubble
            },
            animation: {
                'pulse-once': 'pulse 0.6s ease-in-out 2',  // Pin notification pulse
            }
        }
    },
    plugins: []
}
