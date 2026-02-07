const CandidateModel = require('../models/candidateModel');

/**
 * Candidate Controller
 * Handles all business logic for candidate operations
 */

class CandidateController {
  /**
   * Get all candidates with optional filters
   * GET /api/candidates?search=text&status=Applied
   */
  static async getAllCandidates(req, res) {
    try {
      const { search, status } = req.query;
      
      const filters = {};
      if (search) filters.search = search;
      if (status) filters.status = status;

      const candidates = await CandidateModel.getAll(filters);

      res.status(200).json({
        success: true,
        count: candidates.length,
        data: candidates
      });
    } catch (error) {
      console.error('Error in getAllCandidates:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving candidates',
        error: error.message
      });
    }
  }

  /**
   * Get single candidate by ID
   * GET /api/candidates/:id
   */
  static async getCandidateById(req, res) {
    try {
      const { id } = req.params;
      const candidate = await CandidateModel.getById(id);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: `Candidate with ID ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        data: candidate
      });
    } catch (error) {
      console.error('Error in getCandidateById:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving candidate',
        error: error.message
      });
    }
  }

  /**
   * Create new candidate
   * POST /api/candidates
   */
  static async createCandidate(req, res) {
    try {
      const candidateData = req.body;

      // Check if email already exists
      const emailExists = await CandidateModel.emailExists(candidateData.email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          field: 'email'
        });
      }

      const newCandidate = await CandidateModel.create(candidateData);

      res.status(201).json({
        success: true,
        message: 'Candidate created successfully',
        data: newCandidate
      });
    } catch (error) {
      console.error('Error in createCandidate:', error);
      
      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message,
          field: 'email'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating candidate',
        error: error.message
      });
    }
  }

  /**
   * Update existing candidate
   * PUT /api/candidates/:id
   */
  static async updateCandidate(req, res) {
    try {
      const { id } = req.params;
      const candidateData = req.body;

      // Check if candidate exists
      const existingCandidate = await CandidateModel.getById(id);
      if (!existingCandidate) {
        return res.status(404).json({
          success: false,
          message: `Candidate with ID ${id} not found`
        });
      }

      // Check if email already exists (excluding current candidate)
      const emailExists = await CandidateModel.emailExists(candidateData.email, id);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          field: 'email'
        });
      }

      const updatedCandidate = await CandidateModel.update(id, candidateData);

      res.status(200).json({
        success: true,
        message: 'Candidate updated successfully',
        data: updatedCandidate
      });
    } catch (error) {
      console.error('Error in updateCandidate:', error);

      if (error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: error.message,
          field: 'email'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating candidate',
        error: error.message
      });
    }
  }

  /**
   * Delete candidate
   * DELETE /api/candidates/:id
   */
  static async deleteCandidate(req, res) {
    try {
      const { id } = req.params;

      const deleted = await CandidateModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `Candidate with ID ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Candidate deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteCandidate:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting candidate',
        error: error.message
      });
    }
  }

  /**
   * Get statistics
   * GET /api/candidates/stats
   */
  static async getStatistics(req, res) {
    try {
      const stats = await CandidateModel.getStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving statistics',
        error: error.message
      });
    }
  }
}

module.exports = CandidateController;