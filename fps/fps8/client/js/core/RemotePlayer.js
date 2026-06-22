class RemotePlayer extends Character {
    constructor(scene, position, name, teamColor, team = 'remote') {
        super(scene, position, team, teamColor);

        this.playerName = name;
        
        const labelColor = teamColor === 0x4444ff ? '#4444ff' : '#ff4444';
        this.label = this.createLabel(name, labelColor, { width: 128, height: 64 });
        this.label.scale.set(1.2, 0.6, 1);
        this.label.position.y = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 + 0.5;
        this.skeleton.root.add(this.label);
    }
}
