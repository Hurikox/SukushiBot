const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: "snipe",
        description: "Affiche le dernier message supprimé dans ce salon.",
        options: [
            {
                name: "user",
                description: "Filtrer par utilisateur (optionnel).",
                type: 6,
                required: false
            }
        ]
    },
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "Tu dois avoir la permission Gérer les messages pour utiliser cette commande.", ephemeral: true });
        }

        const sniped = client.snipes.get(interaction.channel.id);
        if (!sniped) {
            return interaction.reply({ content: "Aucun message supprimé récent trouvé dans ce salon.", ephemeral: true });
        }

        const user = interaction.options.getUser("user");
        if (user && user.id !== sniped.authorId) {
            return interaction.reply({ content: "Aucun message supprimé de cet utilisateur trouvé dans ce salon.", ephemeral: true });
        }

        const embed = {
            color: 0x2f3136,
            title: "Dernier message supprimé",
            fields: [
                { name: "Auteur", value: `<@${sniped.authorId}>`, inline: true },
                { name: "Message", value: sniped.content.slice(0, 1024) || "(Aucun texte)", inline: false },
                { name: "Supprimé à", value: `<t:${Math.floor(sniped.deletedAt.getTime() / 1000)}:F>`, inline: true }
            ],
            timestamp: new Date().toISOString()
        };

        if (sniped.attachment) {
            embed.image = { url: sniped.attachment };
        }

        await interaction.reply({ embeds: [embed] });
    }
};
