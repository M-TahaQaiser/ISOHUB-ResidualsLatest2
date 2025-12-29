import React from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';

const ReportsListHeader = ({ 
  filterMonth, 
  filterYear, 
  setFilterMonth, 
  setFilterYear, 
  reportType, 
  setReportType, 
  searchTerm, 
  setSearchTerm, 
  onUploadClick,
  uniqueFirstNames,
  uniqueProcessor 
}) => {
    const navigate = useNavigate();

    const handleUploadClick = () => {
        navigate('/upload-report');
    };
    // console.log(uniqueProcessor,'uniqueFirstProcessor from header');
    // console.log(reportType,'reportType')

    // Generate years from 2020 to the current year dynamically
    const getYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2020; year <= currentYear; year++) {
            years.push(year);
        }
        return years;
    };

    return (
        <div className="reports-header">
            <div className="header">
                <h2 className='text-lg font-semibold text-white mb-4'>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports</h2>
                <button onClick={handleUploadClick} className='text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400'>Go to Report Upload</button>
            </div>

            <div className="filters">
                {/* Month filter */}
                <select className='bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400 p-right' value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>

                {/* Year filter */}
                <select className='bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400 p-right' value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                    <option value="">All Years</option>
                    {getYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Report type filter */}
                <select className='bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400 p-right' value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="all">All Reports</option>
                    <option value="agent">Agent Reports</option>
                    <option value="agent-summary">Agent Summary Reports</option> {/* New Agent Summary Reports Option */}
                    <option value="ar">AR Reports</option>
                    <option value="bank-summary">Bank Summary Reports</option>
                    <option value="billing">Billing Reports</option>
                    <option value="processor">Processor Reports</option>
                    <option value="processor-summary">Processor Summary Reports</option>
                </select>

                {/* Search field */}
                <input
                    type="text"
                    placeholder="Search reports..."
                    className='bg-zinc-800 border-zinc-700 text-white rounded-md focus:ring-yellow-400 focus:border-yellow-400'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {
                    reportType === 'agent' && (
                        <div className="w-64">
                            <Select
                                options={(uniqueFirstNames || []).map(name => ({
                                    value: name,
                                    label: name
                                }))}
                                placeholder="Select an Agent"
                                onChange={(selectedOption) => {
                                    setSearchTerm(selectedOption?.value || '');
                                }}
                                isClearable
                                menuShouldScrollIntoView={false}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        backgroundColor: '#1a1a1a',
                                        borderColor: '#444',
                                        color: '#fff',
                                        minHeight: '38px', // matches Bootstrap dropdown height
                                        paddingLeft: '8px',
                                        padding: '4px',
                                        fontSize: '14px',
                                        fontSize: '16px',
                                        boxShadow: 'none',
                                    }),
                                    singleValue: (provided) => ({
                                        ...provided,
                                        color: '#ccc',
                                    }),
                                    menu: (provided) => ({
                                        ...provided,
                                        backgroundColor: '#1a1a1a',
                                        maxHeight: 'none', // removes scroll
                                        color: '#fff',
                                        zIndex: 9999,
                                    }),
                                    option: (provided, state) => ({
                                        ...provided,
                                        backgroundColor: state.isFocused ? '#333' : '#1a1a1a',
                                        color: '#fff',
                                        padding: '10px',
                                        cursor: 'pointer',
                                    }),
                                    placeholder: (provided) => ({
                                        ...provided,
                                        color: '#888',
                                    }),
                                    dropdownIndicator: (provided) => ({
                                        ...provided,
                                        color: '#888',
                                    }),
                                    indicatorSeparator: () => ({
                                        display: 'none',
                                    }),
                                }}
                            />
                        </div>
                    )
                }
 
                {
                    reportType === 'processor' && (
                        <div className="w-64">
                              <Select
                                options={(uniqueProcessor || []).map(name => ({
                                    value: name,
                                    label: name
                                }))}
                                placeholder="Select an Processor"
                                onChange={(selectedOption) => {
                                    setSearchTerm(selectedOption?.value || '');
                                }}
                                isClearable
                                menuShouldScrollIntoView={false}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (provided) => ({
                                        ...provided,
                                        backgroundColor: '#1a1a1a',
                                        borderColor: '#444',
                                        color: '#fff',
                                        minHeight: '38px', // matches Bootstrap dropdown height
                                        paddingLeft: '8px',
                                        padding: '4px',
                                        fontSize: '16px',
                                        boxShadow: 'none',
                                    }),
                                    singleValue: (provided) => ({
                                        ...provided,
                                        color: '#ccc',
                                    }),
                                    menu: (provided) => ({
                                        ...provided,
                                        backgroundColor: '#1a1a1a',
                                        maxHeight: 'none', // removes scroll
                                        color: '#fff',
                                        zIndex: 9999,
                                    }),
                                    option: (provided, state) => ({
                                        ...provided,
                                        backgroundColor: state.isFocused ? '#333' : '#1a1a1a',
                                        color: '#fff',
                                        padding: '10px',
                                        cursor: 'pointer',
                                    }),
                                    placeholder: (provided) => ({
                                        ...provided,
                                        color: '#888',
                                    }),
                                    dropdownIndicator: (provided) => ({
                                        ...provided,
                                        color: '#888',
                                    }),
                                    indicatorSeparator: () => ({
                                        display: 'none',
                                    }),
                                }}
                            />
                        </div>



                    )
                }

            </div>
        </div>
    );
};

export default ReportsListHeader;
