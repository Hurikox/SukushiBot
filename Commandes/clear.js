const { PermissionsBitField, ChannelType } = require("discord.js");

module.exports = {
    data: {
        name: "clear",
        description: "Supprime un nombre de messages dans le salon actuel.",
        options: [
            {
                name: "amount",
                description: "Nombre de messages à supprimer (max 1000).",
                type: 4,
                required: true,
                minValue: 1,
                maxValue: 1000
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "Tu dois avoir la permission Gérer les messages pour utiliser cette commande.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            return interaction.reply({ content: "Je ne peux supprimer des messages que dans un salon texte de serveur.", ephemeral: true });
        }

        const amount = interaction.options.getInteger("amount");
        await interaction.deferReply({ ephemeral: true });

        let remaining = amount;
        let deletedCount = 0;

        try {
            while (remaining > 0) {
                const batchSize = Math.min(remaining, 100);
                const deleted = await channel.bulkDelete(batchSize, true);
                deletedCount += deleted.size;
                remaining -= deleted.size;

                if (deleted.size < batchSize) {
                    break;
                }
            }

            const message = deletedCount > 0
                ? `✅ ${deletedCount} message(s) supprimé(s).`
                : "⚠️ Aucun message récent à supprimer (messages de plus de 14 jours ou déjà supprimés).";

            await interaction.editReply({ content: `${message}` });
        } catch (error) {
            console.error("Erreur clear:", error);
            await interaction.editReply({ content: "❌ Impossible de supprimer les messages. Vérifie les permissions du bot.", ephemeral: true });
        }
    }
};
