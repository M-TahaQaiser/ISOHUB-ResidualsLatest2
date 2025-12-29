// if using mongodb
import { db } from '../lib/database.lib.js';
import Constants from '../lib/constants.lib.js';

export default class ApReportModel {

    static getApReport = async (organizationID, processor, monthYear) => {
        try {
            const result = await db.dbReports.findOne({organizationID, processor, monthYear});
            return result;
        } catch (error) {
            console.error('Error getting AP report from DB: ' + error.message);
            new Error('Error getting AP report from DB: ' + error.message);
        };
    };

    static createApReport = async (organizationID, processor, monthYear, reportData) => {
        try {
            const result = await db.dbReports.insertOne({organizationID, processor, monthYear, reportData});
            return result;
        } catch (error) {
            console.error('Error creating AP report in DB: ' + error.message);
            new Error('Error creating AP report in DB: ' + error.message);
        };
    };

    static updateApReport = async (organizationID, processor, monthYear, reportData) => {
        try {
            const result = db.dbReports.updateOne({organizationID, processor, monthYear}, {$set: {reportData}});
            return result;
        } catch (error) {
            console.error('Error updating AP report in DB: ' + error.message);
            new Error('Error updating AP report in DB: ' + error.message);
        };
    };
}