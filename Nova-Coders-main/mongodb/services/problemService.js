const Problem = require('../models/Problem');

const ProblemService = {
    async createProblem(problemData) {
        const problem = new Problem(problemData);
        return await problem.save();
    },

    async getProblemById(problemId) {
        return await Problem.findById(problemId);
    },

    async getRandomProblem(difficulty) {
        const count = await Problem.countDocuments({ difficulty });
        const random = Math.floor(Math.random() * count);
        return await Problem.findOne({ difficulty }).skip(random);
    },

    async getProblemsByDifficulty(difficulty) {
        return await Problem.find({ difficulty })
            .select('title description difficulty category')
            .sort({ createdAt: -1 });
    },

    async updateProblem(problemId, updates) {
        return await Problem.findByIdAndUpdate(problemId, updates, { new: true });
    },

    async deleteProblem(problemId) {
        return await Problem.findByIdAndDelete(problemId);
    },

    async addTestCase(problemId, testCase) {
        return await Problem.findByIdAndUpdate(
            problemId,
            { $push: { testCases: testCase } },
            { new: true }
        );
    },

    async getProblemsByCategory(category) {
        return await Problem.find({ category })
            .select('title description difficulty category')
            .sort({ difficulty: 1 });
    },

    async searchProblems(query) {
        return await Problem.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        })
            .select('title description difficulty category')
            .sort({ difficulty: 1 });
    }
};

module.exports = ProblemService; 