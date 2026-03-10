import React from 'react';
import { Composition } from '../../lib/types';
import { getLayoutConfig } from '../../lib/layout';
import { useStore, ActiveSelectionType } from '../../lib/store';

interface Props {
    composition: Composition;
    config: ReturnType<typeof getLayoutConfig>;
}

export function HeaderRenderer({ composition, config }: Props) {
    const centerX = config.maxWidth / 2;
    const { activeSelection, setActiveSelection } = useStore();
    const style = composition.style || {};

    const handleGlobalClick = (e: React.MouseEvent, type: ActiveSelectionType) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveSelection({ sectionId: 'global', type, rect });
    };

    const getFontStyle = (modifiers?: ('bold' | 'italic' | 'underline')[], defaultWeight = 'normal', defaultStyle = 'normal') => {
        if (!modifiers) {
            return {
                fontWeight: defaultWeight,
                fontStyle: defaultStyle,
                textDecoration: 'none',
            };
        }
        return {
            fontWeight: modifiers.includes('bold') ? 'bold' : 'normal',
            fontStyle: modifiers.includes('italic') ? 'italic' : 'normal',
            textDecoration: modifiers.includes('underline') ? 'underline' : 'none',
        };
    };

    const isSelected = (type: ActiveSelectionType) => activeSelection.sectionId === 'global' && activeSelection.type === type;

    return (
        <g className="composition-header">
            {/* Title */}
            <text
                x={centerX}
                y={0}
                textAnchor="middle"
                fontSize={28}
                fontFamily="serif"
                fill={isSelected('globalTitle') ? '#3b82f6' : (style.hideTitle ? '#d1d5db' : (style.titleColor || 'black'))}
                style={getFontStyle(style.titleModifiers, 'bold', 'normal')}
                {...getFontStyle(style.titleModifiers, 'bold', 'normal')}
                className={`cursor-pointer ${style.hideTitle ? 'print:hidden' : ''}`}
                onClick={(e) => handleGlobalClick(e, 'globalTitle')}
            >
                {composition.title}
            </text>

            {/* Subtitle */}
            {composition.subtitle && (
                <text
                    x={centerX}
                    y={28}
                    textAnchor="middle"
                    fontSize={20}
                    fontFamily="serif"
                    fill={isSelected('globalSubtitle') ? '#3b82f6' : (style.hideSubtitle ? '#d1d5db' : (style.subtitleColor || 'gray'))}
                    style={getFontStyle(style.subtitleModifiers, 'normal', 'italic')}
                    {...getFontStyle(style.subtitleModifiers, 'normal', 'italic')}
                    className={`cursor-pointer ${style.hideSubtitle ? 'print:hidden' : ''}`}
                    onClick={(e) => handleGlobalClick(e, 'globalSubtitle')}
                >
                    {composition.subtitle}
                </text>
            )}

            {/* Composer */}
            <text
                x={config.maxWidth}
                y={10}
                textAnchor="end"
                fontSize={16}
                fontFamily="sans-serif"
                fill={isSelected('globalComposer') ? '#3b82f6' : (style.hideComposer ? '#d1d5db' : (style.composerColor || 'black'))}
                style={getFontStyle(style.composerModifiers, 'normal', 'normal')}
                {...getFontStyle(style.composerModifiers, 'normal', 'normal')}
                className={`cursor-pointer ${style.hideComposer ? 'print:hidden' : ''}`}
                onClick={(e) => handleGlobalClick(e, 'globalComposer')}
            >
                {composition.composer}
            </text>

            {/* Arranger */}
            {composition.arranger && (
                <text
                    x={config.maxWidth}
                    y={30}
                    textAnchor="end"
                    fontSize={14}
                    fontFamily="sans-serif"
                    fill={isSelected('globalArranger') ? '#3b82f6' : (style.hideArranger ? '#d1d5db' : (style.arrangerColor || 'gray'))}
                    style={getFontStyle(style.arrangerModifiers, 'normal', 'italic')}
                    {...getFontStyle(style.arrangerModifiers, 'normal', 'italic')}
                    className={`cursor-pointer ${style.hideArranger ? 'print:hidden' : ''}`}
                    onClick={(e) => handleGlobalClick(e, 'globalArranger')}
                >
                    {composition.arranger}
                </text>
            )}
        </g>
    );
}
