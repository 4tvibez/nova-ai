module.exports = async (req, res) => {
  res.json({
    mood: "calm",
    happiness: 60,
    sadness: 10,
    anger: 5,
    hurt: 5,
    excitement: 30,
    trust: 70,
    energy: 70
  });
};
