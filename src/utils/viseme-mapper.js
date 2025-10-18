/**
 * VisemeMapper - Maps phonemes to mouth shapes
 */

export const VISEME_SHAPES = {
    neutral: { mouthOpen: 0, mouthSmile: 0, jawOpen: 0 },
    closed: { mouthOpen: 0, mouthSmile: 0, jawOpen: 0 },
    open: { mouthOpen: 0.7, mouthSmile: 0, jawOpen: 0.6 },
    wide: { mouthOpen: 0.4, mouthSmile: 0.8, jawOpen: 0.2 },
    rounded: { mouthOpen: 0.5, mouthSmile: 0, jawOpen: 0.3 },
    medium: { mouthOpen: 0.3, mouthSmile: 0.2, jawOpen: 0.2 }
};

export class VisemeMapper {
    static getViseme(phoneme) {
        return VISEME_SHAPES[phoneme] || VISEME_SHAPES.medium;
    }

    static interpolate(from, to, t) {
        return {
            mouthOpen: from.mouthOpen + (to.mouthOpen - from.mouthOpen) * t,
            mouthSmile: from.mouthSmile + (to.mouthSmile - from.mouthSmile) * t,
            jawOpen: from.jawOpen + (to.jawOpen - from.jawOpen) * t
        };
    }
}
