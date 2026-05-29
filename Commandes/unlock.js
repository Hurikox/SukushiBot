const { PermissionsBitField } = require("discord.js");

function getUnlockPermissions(channel) {
    return channel.isVoiceBased()
        ? { Speak: null }
        : { SendMessages: null, AddReactions: null };
}

module.exports = {
    data: {
        name: "unlock",
        description: "Déverrouille le salon actuel.",
        options: [
            {
                name: "reason",
                description: "Raison du déverrouillage",
                type: 3,
                required: false
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Tu n'as pas la permission de déverrouiller ce salon.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (!channel || (!channel.isTextBased() && !channel.isVoiceBased())) {
            return interaction.reply({ content: "Je ne peux déverrouiller que des salons texte ou vocaux.", ephemeral: true });
        }

        const botMember = interaction.guild.members.me || await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Le bot n'a pas la permission Manage Channels.", ephemeral: true });
        }

        await interaction.deferReply();
        const reason = interaction.options.getString("reason") || "Aucune raison fournie";

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, getUnlockPermissions(channel));
            await interaction.editReply(`✅ Salon déverrouillé.\nRaison : ${reason}`);
        } catch (error) {
            console.error("Erreur unlock:", error);
            await interaction.editReply("❌ Impossible de déverrouiller ce salon. Vérifie les permissions du bot.");
        }
    }
};