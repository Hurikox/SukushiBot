const { PermissionsBitField, ChannelType } = require("discord.js");

function getExemptRoles(guild) {
    const exemptIds = (process.env.EXEMPT_ROLE_IDS || "").split(",").map(id => id.trim()).filter(Boolean);
    return guild.roles.cache.filter(role =>
        exemptIds.includes(role.id) ||
        role.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
        ["Moderator", "Mod", "Modo", "Admin", "Administrateur"].includes(role.name)
    );
}

function getLockPermissions() {
    return { SendMessages: false, AddReactions: false };
}

function getExemptPermissions() {
    return { SendMessages: true, AddReactions: true };
}

module.exports = {
    data: {
        name: "lockall",
        description: "Verrouille tous les salons texte du serveur.",
        options: [
            {
                name: "reason",
                description: "Raison du verrouillage global",
                type: 3,
                required: false
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Tu n'as pas la permission de verrouiller tous les salons.", ephemeral: true });
        }

        const botMember = interaction.guild.members.me || await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
        if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: "Le bot n'a pas la permission Manage Channels.", ephemeral: true });
        }

        await interaction.deferReply();
        const reason = interaction.options.getString("reason") || "Aucune raison fournie";
        const channels = await interaction.guild.channels.fetch();
        const textChannels = channels.filter(channel => [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(channel.type));
        const exemptRoles = getExemptRoles(interaction.guild);
        let locked = 0;
        let failed = 0;

        for (const channel of textChannels.values()) {
            try {
                const botPermissions = channel.permissionsFor(botMember);
                if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    failed += 1;
                    continue;
                }

                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, getLockPermissions());
                for (const role of exemptRoles.values()) {
                    await channel.permissionOverwrites.edit(role, getExemptPermissions()).catch(() => null);
                }

                locked += 1;
            } catch (error) {
                console.error(`Impossible de verrouiller ${channel.name}:`, error);
                failed += 1;
            }
        }

        await interaction.editReply(`🔒 ${locked} salon(s) verrouillé(s).\nRaison : ${reason}${failed ? `\n${failed} salon(s) non traités (permission manquante)` : ""}`);
    }
};
