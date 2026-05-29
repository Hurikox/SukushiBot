const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: "cancel",
        description: "Annule la commande précédente en attente.",
        options: []
    },
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const pending = client.pendingCommands.get(userId);

        if (!pending) {
            return interaction.reply({ content: "Aucune commande en attente à annuler.", ephemeral: true });
        }

        if (pending.id === interaction.id) {
            return interaction.reply({ content: "Il n'y a pas de commande précédente à annuler.", ephemeral: true });
        }

        try {
            if (pending.deferred) {
                await pending.editReply({ content: "⚠️ La commande précédente a été annulée." });
            } else if (!pending.replied) {
                await pending.reply({ content: "⚠️ La commande précédente a été annulée.", ephemeral: true });
            }
            client.pendingCommands.delete(userId);
            return interaction.reply({ content: "✅ Commande annulée.", ephemeral: true });
        } catch (error) {
            console.error("Erreur cancel:", error);
            return interaction.reply({ content: "❌ Impossible d'annuler la commande précédente.", ephemeral: true });
        }
    }
};
