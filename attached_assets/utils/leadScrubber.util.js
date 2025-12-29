export default class LeadScrubberUtil {
    // Allowed statuses for valid leads
    static allowedStatuses = [
        'Merchant Is Live', 'Brand New', 'Equipment Shipped', 
        'Switched To Software Vendor', 'Business Closed', 
        'Application Approved', 'Duplicate Account', 
        'Processing Under New MID'
    ];
    static allowedCategory = ['Boarding', 'Retention', 'Merchant Cancelled'];

    // Specific users, companies, partners, and managers to filter out
    static usersToFilterOut = ["Joy West 0827"];
    static companies = ["tracer cocard", "c2fs"]; // Companies to remove
    static partners = ["SIB", "HBS", "PharmaTrush", "Jonathan", "CasTech", "AEZ", "Robert", "WeAudit", "Jason", "ARK", "Bead"];
    static managers = ["Christy", "Cody",];

    static scrubLeads(csvData, existingMIDs = new Set()) {
        // Initialize lists to categorize leads
        const statusFail = [];
        const needsAudit = [];
        const validLeads = [];
        const newMIDs = new Set();

        csvData.forEach((row) => {
            const statusCategory = row['Status Category'];
            const mid = row['Existing MID'] ? row['Existing MID'].toString().trim() : null;

            // Step 1: Duplicate MID check
            if (mid && (existingMIDs.has(mid) || newMIDs.has(mid))) {
                if (mid === '820100012880') {
                console.log(`Skipping duplicate MID: ${mid}`);
                }
                return;
            }

            const excludedDBAs = ["MERCHANT", "CLIENT LEVEL EXPENSE"];
            if (row['DBA'] && excludedDBAs.some(exclusion => row['DBA'].includes(exclusion))) {
                //console.log(`Excluding row for DBA match on MID ${mid}`);
                if (mid === '820100012880') {
                    console.log(`Excluding row for DBA match on MID ${mid}`);
                    }
                return;
            }
    
            if (mid === '820100012880') {
                console.log('Processing problematic row:', row);
            }

            // Step 2: Status filter
            if (!LeadScrubberUtil.allowedCategory.includes(statusCategory)) {
                statusFail.push(row);
                if (mid === '820100012880') {
                console.log(`Status not allowed for MID ${mid}: ${statuscategory}`);
                }
                return;
            }

            // Step 3: User filtering
            const assignedUsers = row['Assigned Users'] ? row['Assigned Users'].split(', ') : [];
            if (mid === '820100012880') {
                console.log(`Original assigned users for MID ${mid}: ${assignedUsers}`);
                }
            ////console.log(`Original assigned users for MID ${mid}: ${assignedUsers}`);
            
            const cleanedUsers = assignedUsers.filter(user =>
                !LeadScrubberUtil.usersToFilterOut.some(filterUser => user.includes(filterUser))
            );
            if (mid === '820100012880') {
                console.log(`After removing specific users for MID ${mid}: ${cleanedUsers}`);
                }
            ////console.log(`After removing specific users for MID ${mid}: ${cleanedUsers}`);

            // Step 4: Remove companies, keeping only agents, partners, and managers
            let filteredUsers = cleanedUsers.filter(user => {
                const userLower = user.toLowerCase();
                const isCompany = LeadScrubberUtil.companies.some(company => userLower.includes(company));
                return !isCompany; // Exclude if it's a company
            });
            if (mid === '820100012880') {
                console.log(`After removing companies for MID ${mid}: ${filteredUsers}`);
                }
            //console.log(`After removing companies for MID ${mid}: ${filteredUsers}`);

            // Step 5: If both "Cody" and "Christy" are present, remove "Christy"
            const hasCody = filteredUsers.some(user => user.toLowerCase().includes("cody burnell"));
            const hasChristy = filteredUsers.some(user => user.toLowerCase().includes("christy"));
            if (hasCody && hasChristy) {
                filteredUsers = filteredUsers.filter(user => !user.toLowerCase().includes("christy"));
                //console.log(`Both Cody and Christy present for MID ${mid}. Removing Christy: ${filteredUsers}`);
            }

            // Step 6: Prepare for audit checks
            const auditReasons = [];
            if (filteredUsers.length === 0) auditReasons.push("No assigned users left after filtering companies");
            if (!mid) auditReasons.push("Missing Existing MID");
            if (filteredUsers.includes("HBS Partner 0827") && !row['Partner Branch Number']) {
                auditReasons.push("Missing Partner Branch Number for HBS Partner 0827");
            }

            if (!row['DBA'] && !row['Legal Name']) auditReasons.push("DBA and Legal Name are both empty");

            // Step 7: Categorize rows
            if (auditReasons.length > 0) {
                needsAudit.push({ ...row, auditReasons: auditReasons.join(', ') });
                if (mid === '820100012880') {
                    console.log(`Row needs audit for MID ${mid}: ${auditReasons}`);
                    }
                //console.log(`Row needs audit for MID ${mid}: ${auditReasons}`);
            } else {
                validLeads.push({ ...row, assignedUsers: filteredUsers.join(', ') });
                if (mid === '820100012880') {
                    console.log(`Row added to valid leads for MID ${mid}: ${filteredUsers}`);
                    }
                //console.log(`Row added to valid leads for MID ${mid}: ${filteredUsers}`);
            }
            if (mid) newMIDs.add(mid);

            if (mid === '820100012880') {
                console.log('Row successfully processed:', row);
            }
        });

        // Return categorized leads
        return { statusFail, needsAudit, validLeads };
    }
}
