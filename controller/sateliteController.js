require("dotenv").config();
const mongoose = require('mongoose');
const TelData = require('../model/tel_data');
const cron = require('node-cron');
const axios = require('axios');

exports.trackSatelite = async (req, res) => {
    try {
        const satelliteNames = req.body.satelliteIds;

        // Run both queries in parallel using Promise.all to improve efficiency
        const [response] = await Promise.all([
            TelData.find({ name: { $in: satelliteNames } }), // Fetch only matching satellites
        ]);

        if (response.length === 0) {
            return res.status(404).json({ message: "No matching satellites found!" });
        }

        // Process filtered data
        const filteredData = response.map(satellite => ({
            name: satellite.name,
            tleLine1: satellite.tleLine1,
            tleLine2: satellite.tleLine2
        }));
        res.status(200).json({ filteredData });
    } catch (error) {
        console.error("❌ Error fetching TLE data:", error);
        res.status(500).json({ message: "Failed to fetch TLE data." });
    }
};

exports.SateliteList = async (req, res) => {
    try {
        // Get the page and limit from the query parameters, with default values if not provided
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not specified
        const limit = parseInt(req.query.limit) || 10;  // Default to 10 items per page if not specified

        // Calculate the number of items to skip
        const skip = (page - 1) * limit;

        // Fetch the satellite names with pagination
        const allSatellites = await TelData.find().skip(skip).limit(limit);
        const list = allSatellites.map(m => m.name);

        // Count the total number of satellites for pagination info
        const totalSatellites = await TelData.countDocuments();

        // Send response with list of satellites and pagination info
        res.status(200).json({
            list,
            page,
            limit,
            totalPages: Math.ceil(totalSatellites / limit),
            totalItems: totalSatellites
        });
    } catch (error) {
        console.error("❌ Error fetching TLE data:", error);
        res.status(500).json({ message: "Failed to fetch TLE data." });
    }
};


const fetchTleData = async () => {
    try {
        console.log("🔄 Fetching TLE data...");
        
        // Fetch data using Tor proxy
        const response = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');

        const lines = response.data.split("\n").map(line => line.trim()).filter(line => line); // Remove empty lines

        // Ensure we have valid TLE data
        if (lines.length < 3) {
            console.warn("⚠️ Not enough data received!");
            return;
        }
        if (lines.length == 0) {
            console.warn("⚠️ No data received!");
            return;
        }

        console.log(`📡 Received ${lines.length / 3} satellites worth of data.`);

        // **Delete old data before inserting new data**
        await TelData.deleteMany({});
        console.log("🗑️ Cleared old TLE data.");

        // Process TLE data (3 lines per satellite)
        let tleRecords = [];
        for (let i = 0; i < lines.length; i += 3) {
            tleRecords.push({
                name: lines[i],         // Satellite name (line 1)
                tleLine1: lines[i + 1], // TLE line 1
                tleLine2: lines[i + 2], // TLE line 2
            });
        }

        // **Bulk insert into MongoDB**
        await TelData.insertMany(tleRecords);
        console.log(`✅ Successfully stored ${tleRecords.length} TLE records.`);

    } catch (error) {
        console.error("❌ Error fetching TLE data:", error.message);
    }
};

// **Schedule the function to run every 20 minutes**
cron.schedule('*/20 * * * *', async () => {
    console.log('⏳ Running scheduled task at:', new Date());
    await fetchTleData();
});
