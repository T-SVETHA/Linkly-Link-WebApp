module.exports = {
    simulateDelay: async function() {
        const delay = Math.floor(Math.random() * 100) + 50;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
};
