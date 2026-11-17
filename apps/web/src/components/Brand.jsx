import { activeBrand } from '@/themes';

// Renders the active theme's logo image, or its text title when no logo is set.
// Text inherits styling from the parent element.
// `placement` ('header' | 'login') — the header bar is only 64px tall, so the
// logo is clamped to fit when used there as a fallback (no header image set).
const Brand = ({ placement = 'header', className = '' }) => {
	const { logo, title } = activeBrand;
	if (logo?.src) {
		return (
			<img
				src={logo.src}
				alt={title || 'Logo'}
				style={{ height: logo.height, width: logo.width }}
				className={`block w-auto max-w-full object-contain ${placement === 'header' ? 'max-h-14' : ''} ${className}`}
			/>
		);
	}
	return <>{title}</>;
};

export default Brand;
