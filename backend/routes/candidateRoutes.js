const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidateController');
const {
  createCandidateValidation,
  updateCandidateValidation,
  getCandidateValidation,
  deleteCandidateValidation,
  validate
} = require('../middleware/validator');

/**
 * Candidate Routes
 * All routes are prefixed with /api/candidates
 */

// GET /api/candidates/stats - Get statistics (must be before /:id route)
router.get('/stats', CandidateController.getStatistics);

// GET /api/candidates - Get all candidates with optional filters
router.get('/', CandidateController.getAllCandidates);

// GET /api/candidates/:id - Get specific candidate
router.get(
  '/:id',
  getCandidateValidation,
  validate,
  CandidateController.getCandidateById
);

// POST /api/candidates - Create new candidate
router.post(
  '/',
  createCandidateValidation,
  validate,
  CandidateController.createCandidate
);

// PUT /api/candidates/:id - Update existing candidate
router.put(
  '/:id',
  updateCandidateValidation,
  validate,
  CandidateController.updateCandidate
);

// DELETE /api/candidates/:id - Delete candidate
router.delete(
  '/:id',
  deleteCandidateValidation,
  validate,
  CandidateController.deleteCandidate
);

module.exports = router;