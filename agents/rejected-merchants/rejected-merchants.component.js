import React, { useState } from 'react';

const RejectedMerchants = ({ data = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const clientsPerPage = 10; // Number of entries per page

    // Calculate the indices for the current page
    const indexOfLastClient = currentPage * clientsPerPage;
    const indexOfFirstClient = indexOfLastClient - clientsPerPage;
    const currentClients = data.slice(indexOfFirstClient, indexOfLastClient);

    // Handle pagination click
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Calculate the total number of pages
    const totalPages = Math.ceil(data.length / clientsPerPage);

    return (
        <div>
            {data.length === 0 ? (
                <p>No data available for rejected merchants.</p>
            ) : (
                <div>
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(data[0]).map((key) => (
                                    <th className='border-l-0 border-b px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider' key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentClients.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300' key={i}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="pagination">
                        {currentPage > 1 && (
                            <button className="pagination-btn" onClick={() => paginate(currentPage - 1)}>
                                &laquo;
                            </button>
                        )}
                        {currentPage > 1 && (
                            <button
                                className="pagination-btn"
                                onClick={() => paginate(currentPage - 1)}
                            >
                                {currentPage - 1}
                            </button>
                        )}
                        <button className="pagination-btn active">
                            {currentPage}
                        </button>
                        {currentPage < totalPages && (
                            <button
                                className="pagination-btn"
                                onClick={() => paginate(currentPage + 1)}
                            >
                                {currentPage + 1}
                            </button>
                        )}
                        {currentPage < totalPages && (
                            <button className="pagination-btn" onClick={() => paginate(currentPage + 1)}>
                                &raquo;
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RejectedMerchants;
