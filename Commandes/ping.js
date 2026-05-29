module.exports = {
    data: {
        name: "ping",
        description: "Répond Pong et affiche la latence."
    },
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.reply({ content: `Pong! Latence: ${latency}ms` });
    }
};
