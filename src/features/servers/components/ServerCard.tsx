import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronRight, Pencil, Star} from 'lucide-react-native';
import {useAppTheme} from '../../../app/ThemeProvider';
import {IconButton} from '../../../shared/components/IconButton';
import {relativeTime} from '../../../shared/utils/time';
import {displayEndpoint} from '../serverUrl';
import type {DshServer} from '../types';
import {StatusPill} from './StatusPill';

interface ServerCardProps {
  server: DshServer;
  onOpen: () => void;
  onEdit: () => void;
}

export function ServerCard({server, onOpen, onEdit}: ServerCardProps) {
  const {colors} = useAppTheme();
  const lastSeen = relativeTime(server.lastConnectedAt);

  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${server.name}`}
        onPress={onOpen}
        className="p-4 pr-14"
        style={({pressed}) => ({
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
        })}>
        <View className="flex-row items-start gap-3">
          <View
            className="mt-0.5 h-11 w-11 items-center justify-center rounded-xl"
            style={{backgroundColor: colors.brandSoft}}>
            <Text
              style={{color: colors.brand, fontSize: 16, fontWeight: '800'}}>
              {server.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                {server.name}
              </Text>
              {server.isDefault ? (
                <Star size={14} color={colors.brand} fill={colors.brand} />
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={{color: colors.textSecondary, fontSize: 13}}>
              {displayEndpoint(server.url)}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <StatusPill status={server.status} />
              {lastSeen ? (
                <Text style={{color: colors.textTertiary, fontSize: 11.5}}>
                  Last connected {lastSeen}
                </Text>
              ) : null}
            </View>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      </Pressable>

      <View className="absolute right-2 top-2">
        <IconButton label={`Edit ${server.name}`} onPress={onEdit}>
          <Pencil size={17} color={colors.textSecondary} />
        </IconButton>
      </View>
    </View>
  );
}
