import React from 'react';
import PropTypes from 'prop-types';
import './header.component.css';

const Header = ({ title, subtitle, supportingData }) => {
    return (
        <div className="header max-w-7xl  mx-auto mb-8 bg-yellow-400 rounded-lg p-6 shadow-lg">
            <div className="header-content w-full go-none">
                <h1 className="header-title text-3xl font-bold text-black font-medium mb-0 w-full" style={{ marginBottom: '0',fontSize: '1.875rem', fontWeight: '700', textAlign:'left' }}>{title}</h1>
                {subtitle && <h2 className="header-subtitle text-black/80 mt-0 mb-0 text-left w-full" style={{ marginBottom: '0',fontSize: '16px', fontWeight: '300' }}>{subtitle}</h2>}
                {supportingData && (
                    <div className="header-supporting-data">
                        {supportingData.map((item, index) => (
                            <div key={index} className="supporting-data-item">
                                {item}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

Header.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    supportingData: PropTypes.arrayOf(PropTypes.node),
};

Header.defaultProps = {
    subtitle: null,
    supportingData: null,
};

export default Header;
