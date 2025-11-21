// skin-manager.js
export class SkinManager {
    constructor() {
        this.skins = {
            'Classic': {
                name: 'Classic',
                bounds: 'assets/3D models/skins/Classic/Bounds.glb',
                tiles: 'assets/3D models/skins/Classic/PlayTiles mesh.glb',
                xPiece: 'assets/3D models/skins/Classic/Xs mesh.glb',
                oPiece: 'assets/3D models/skins/Classic/Os mesh.glb'
            },
            'Game Night': {
                name: 'Game Night',
                bounds: 'assets/3D models/skins/Game Night/Bounds (GN).glb',
                tiles: 'assets/3D models/skins/Game Night/PlayTiles mesh.glb',
                xPiece: 'assets/3D models/skins/Game Night/Xs mesh (GN) 2.glb',
                oPiece: 'assets/3D models/skins/Game Night/Os mesh (GN) 2.glb'
            },
            'Under Water': {
                name: 'Under Water',
                bounds: 'assets/3D models/skins/Under Water/Bounds (UW).glb',
                tiles: 'assets/3D models/skins/Under Water/PlayTiles mesh.glb',
                xPiece: 'assets/3D models/skins/Under Water/Xs mesh (UW).glb',
                oPiece: 'assets/3D models/skins/Under Water/Os mesh (UW).glb'
            }
            // Add more skins here as you create them
        };
        
        this.currentSkin = 'Classic';
        this.availableSkins = Object.keys(this.skins);
    }

    getRandomSkin() {
        const randomIndex = Math.floor(Math.random() * this.availableSkins.length);
        return this.availableSkins[randomIndex];
    }

    getSkin(skinName) {
        return this.skins[skinName] || this.skins['Classic'];
    }

    getAllSkins() {
        return this.skins;
    }
}