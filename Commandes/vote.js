const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        name: "vote",
        description: "Créer un vote à deux options avec des réactions 1️⃣ et 2️⃣.",
        options: [
            {
                name: "question",
                description: "La question du vote.",
                type: 3,
                required: true
            },
            {
                name: "option1",
                description: "Première option.",
                type: 3,
                required: true
            },
            {
                name: "option2",
                description: "Deuxième option.",
                type: 3,
                required: true
            }
        ]
    },
    async execute(interaction) {
        const question = interaction.options.getString("question");
        const option1 = interaction.options.getString("option1");
        const option2 = interaction.options.getString("option2");

        const embed = new EmbedBuilder()
            .setTitle("Vote")
            .setDescription(`**${question}**`)
            .addFields(
                { name: "1️⃣ Option 1", value: option1, inline: false },
                { name: "2️⃣ Option 2", value: option2, inline: false }
            )
            .setColor(0x00AE86)
            .setFooter({ text: `Vote demandé par ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
        const message = await interaction.fetchReply();

        try {
            await message.react("1️⃣");
            await message.react("2️⃣");
        } catch (error) {
            console.error("Impossible d'ajouter les réactions au vote :", error);
            await interaction.followUp({ content: "⚠️ Je n'ai pas pu ajouter les réactions au message. Vérifie mes permissions.", ephemeral: true });
        }
    }
};
