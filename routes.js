const express = require("express");
//const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();

/* ############################################ Controllers ############################################ */
const SateliteController = require("./controller/sateliteController");
router.post('/track',SateliteController.trackSatelite);
router.get('/list',SateliteController.SateliteList);

module.exports = router;