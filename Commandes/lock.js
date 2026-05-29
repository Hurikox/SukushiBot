const { PermissionsBitField } = require("discord.js");

function getExemptRoles(guild) {
    const exemptIds = (process.env.EXEMPT_ROLE_IDS || "").split(",").map(id => id.trim()).filter(Boolean);
    return guild.roles.cache.filter(role =>
        exemptIds.includes(role.id) ||
        role.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
        ["Moderator", "Mod", "Modo", "Admin", "Administrateur"].includes(role.name)
    );
}

function getLockPermissions(channel) {
    return channel.isVoiceBased()
        ? { Speak: false }
        : { SendMessages: false, AddReactions: false };
}

function getExemptPermissions(channel) {
    return channel.isVoiceBased()
        ? { Speak: true }
        : { SendMessages: true, AddReactions: true };
}

module.exports = {
    data: {
        name: "lock",
        description: "Verrouille le salon actuel.",
        options: [
            {
                name: "reason",
                description: "Raison du verrouillage",
                type: 3,
                required: false
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Tu n'as pas la permission de verrouiller ce salon.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (!channel || (!channel.isTextBased() && !channel.isVoiceBased())) {
            return interaction.reply({ content: "Je ne peux verrouiller que des salons texte ou vocaux.", ephemeral: true });
        }

        const botMember = interaction.guild.members.me || await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Le bot n'a pas la permission Manage Channels.", ephemeral: true });
        }

        await interaction.deferReply();
        const reason = interaction.options.getString("reason") || "Aucune raison fournie";

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, getLockPermissions(channel));
            const exemptRoles = getExemptRoles(interaction.guild);
            for (const role of exemptRoles.values()) {
                await channel.permissionOverwrites.edit(role, getExemptPermissions(channel)).catch(() => null);
            }
            await interaction.editReply(`✅ Salon verrouillé.\nRaison : ${reason}`);
        } catch (error) {
            console.error("Erreur lock:", error);
            await interaction.editReply("❌ Impossible de verrouiller ce salon. Vérifie les permissions du bot.");
        }
    }
};