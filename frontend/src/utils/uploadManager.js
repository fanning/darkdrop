/**
 * Utility functions for managing incomplete file uploads
 * Used by the notification system to remind users about failed uploads
 */

export const uploadManager = {
  /**
   * Add a failed upload to localStorage
   * @param {Object} uploadInfo - Information about the failed upload
   */
  addIncompleteUpload: (uploadInfo) => {
    const incomplete = JSON.parse(localStorage.getItem('darkdrop_incomplete_uploads') || '[]')
    incomplete.push({
      ...uploadInfo,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('darkdrop_incomplete_uploads', JSON.stringify(incomplete))
  },

  /**
   * Remove an upload from the incomplete list
   * @param {string} uploadId - The ID of the upload to remove
   */
  removeIncompleteUpload: (uploadId) => {
    const incomplete = JSON.parse(localStorage.getItem('darkdrop_incomplete_uploads') || '[]')
    const filtered = incomplete.filter(upload => upload.id !== uploadId)
    localStorage.setItem('darkdrop_incomplete_uploads', JSON.stringify(filtered))
  },

  /**
   * Clear all incomplete uploads
   */
  clearIncompleteUploads: () => {
    localStorage.removeItem('darkdrop_incomplete_uploads')
  },

  /**
   * Get all incomplete uploads
   * @returns {Array} List of incomplete uploads
   */
  getIncompleteUploads: () => {
    return JSON.parse(localStorage.getItem('darkdrop_incomplete_uploads') || '[]')
  }
}
