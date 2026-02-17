const cloudinary = require('../config/cloudinary')
const user = require('../models/User')

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      })
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'cway-admin', // Optional: organize images in a folder
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Resize if needed
        { quality: 'auto' }, // Auto optimize quality
      ],
    })

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
}

exports.deleteImage = async (req, res) => {
  try {
    let { publicId } = req.params

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide image public ID',
      })
    }

    // Decode publicId to handle URL encoding (e.g., "cway-admin%2Ffolder%2Fimage" -> "cway-admin/folder/image")
    // Express automatically decodes, but we'll decode explicitly to be safe
    publicId = decodeURIComponent(publicId)

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully',
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found',
      })
    }
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image',
    })
  }
}


exports.profileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an profile image',
      })
    }
    const updatedUser = await user.findById(req.user._id);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'profile', // Optional: organize images in a folder
      resource_type: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto' }, 
      ],
    })

    if(updatedUser.profileImage){
      await cloudinary.uploader.destroy(updatedUser.profileImage.split('/').pop().split('.')[0]);
    }
    updatedUser.profileImage = uploadResult.secure_url;
    await updatedUser.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: uploadResult.secure_url
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    })
  }
}