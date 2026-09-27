import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import JsBarcode from 'jsbarcode';

export default function BarcodeImage({ value, label, svgRef }) {
	const localRef = useRef(null);

	useEffect(() => {
		const element = svgRef?.current || localRef.current;
		if (element && value) {
			JsBarcode(element, value, {
				format: 'CODE128',
				displayValue: true,
				fontSize: 14,
				height: 64,
				margin: 8,
				width: 2,
			});
		}
	}, [value, svgRef]);

	return (
		<svg
			ref={svgRef || localRef}
			className="block h-auto w-full max-w-full"
			role="img"
			aria-label={label || `Barcode ${value}`}
		/>
	);
}

BarcodeImage.propTypes = {
	value: PropTypes.string.isRequired,
	label: PropTypes.string,
	svgRef: PropTypes.shape({ current: PropTypes.object }),
};
