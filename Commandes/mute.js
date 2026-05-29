const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: "mute",
        description: "Mute un membre avec une raison.",
        options: [
            {
                name: "target",
                description: "Membre à mute",
                type: 6,
                required: true
            },
            {
                name: "reason",
                description: "Raison du mute",
                type: 3,
                required: false
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers) && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: "Tu n'as pas la permission de mute des membres.", ephemeral: true });
        }

        const target = interaction.options.getUser("target");
        const reason = interaction.options.getString("reason") || "Aucune raison fournie";
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
        }

        const botMember = interaction.guild.members.me;
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: "Le bot n'a pas la permission Manage Roles.", ephemeral: true });
        }

        await interaction.deferReply();

        let role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) {
            role = await interaction.guild.roles.create({
                name: "Muted",
                permissions: []
            });
        } else if (botMember.roles.highest.position <= role.position) {
            return interaction.editReply({ content: "Le rôle Muted est au même niveau ou au-dessus du bot, le mute ne peut pas être appliqué.", ephemeral: true });
        }

        for (const channel of interaction.guild.channels.cache.values()) {
            if (channel.isTextBased()) {
                await channel.permissionOverwrites.edit(role, {
                    SendMessages: false,
                    AddReactions: false
                }).catch(() => null);
            }
            if (channel.isVoiceBased()) {
                await channel.permissionOverwrites.edit(role, {
                    Speak: false
                }).catch(() => null);
            }
        }

        await member.roles.add(role, `Mute par ${interaction.user.tag} : ${reason}`);
        await interaction.editReply(`🔇 ${member.user.tag} a été mute.
Raison : ${reason}`);
    }
};