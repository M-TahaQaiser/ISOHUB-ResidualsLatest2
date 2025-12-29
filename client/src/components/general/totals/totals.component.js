import React from "react";
import PropTypes from "prop-types";
import Decimal from "decimal.js";
import "./totals.component.css";

const Totals = ({ data, columns, onTotalsCalculated }) => {
    if (!data || data.length === 0) return null;

    // Helper function to parse numeric values from strings (e.g., "$15.00" or "735")
    const parseNumericValue = (value) => {
        if (typeof value === "string") {
            const parsedValue = parseFloat(value.replace(/[^0-9.-]+/g, "")); // Remove non-numeric characters
            return isNaN(parsedValue) ? 0 : parsedValue;
        }
        return typeof value === "number" ? value : 0;
    };

    // Calculate totals for numeric columns using Decimal.js
    const totals = columns.reduce((acc, column) => {
        if (data.some((row) => parseNumericValue(row[column.field]) > 0)) {
            const totalValue = data.reduce((sum, row) => {
                const value = new Decimal(parseNumericValue(row[column.field]));
                return new Decimal(sum).plus(value);
            }, new Decimal(0));

            // Round to two decimal places for the totals
            acc[column.label] = totalValue.toDecimalPlaces(2).toNumber();
        } else {
            acc[column.label] = null; // Skip columns without numeric data
        }
        return acc;
    }, {});

    // Pass the totals to the parent component for export
    if (onTotalsCalculated) {
        onTotalsCalculated(totals);
    }

    return (
        <div className="totals-container">
            {Object.entries(totals).map(([label, value]) =>
                value !== null ? (
                    <div key={label} className="total-field shadow-none bg-zinc-900 rounded-lg shadow-sm p-4  border border-yellow-400/20">
                        <span className="total-label text-xs font-medium text-gray-300">{label}</span>
                        <span className="total-value">
                            {value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                ) : null
            )}
        </div>
    );
};

Totals.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            field: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    onTotalsCalculated: PropTypes.func, // Callback for passing totals to parent
};

export default Totals;
