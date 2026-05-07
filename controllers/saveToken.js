const express = require("express");
const Token = require("../models/firebase");

exports.saveToken =  async (req, res) => {
  try {
    const { userId, token } = req.body;

    await Token.findByIdAndUpdate(userId, {
      fcmToken: token,  
    });

    res.json({
      success: true,
      message: "Token saved",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
};
