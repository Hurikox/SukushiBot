const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: {
        name: "unmute",
        description: "Enlève le mute d'un membre.",
        options: [
            {
                name: "target",
                description: "Membre à unmute",
                type: 6,
                required: true
            }
        ]
    },
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers) && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: "Tu n'as pas la permission d'unmute des membres.", ephemeral: true });
        }

        const target = interaction.options.getUser("target");
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: "Membre introuvable.", ephemeral: true });
        }

        await interaction.deferReply();

        const role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) {
            return interaction.editReply({ content: "Aucun rôle Muted trouvé.", ephemeral: true });
        }

        if (!member.roles.cache.has(role.id)) {
            return interaction.editReply({ content: "Ce membre n'est pas mute.", ephemeral: true });
        }

        await member.roles.remove(role, `Unmute par ${interaction.user.tag}`);
        await interaction.editReply(`✅ ${member.user.tag} a été unmute.`);
    }
};