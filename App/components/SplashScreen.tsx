/**
 * SplashScreen — Logimax Tracker
 * Module: hr (#7C3AED family) per design tokens
 *
 * Animations:
 *  1. Logo spring-pops in
 *  2. Pulse rings expand outward
 *  3. Brand name + tagline slide up
 *  4. Loading dots bounce
 *  5. Screen fades OUT → onFinish()
 */

import { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Logimax hr-module accent — #7C3AED family
const BRAND_GRADIENT: [string, string, string] = ['#4C1D95', '#7C3AED', '#A855F7'];

interface Props {
  onFinish: () => void;
}

// ─── Bouncing Dot ────────────────────────────────────────────────────────────

function BouncingDot({ delay }: { delay: number }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, { toValue: -9, duration: 260, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(480),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ translateY: bounce }] }}
      className="w-[7px] h-[7px] rounded-full bg-white/55"
    />
  );
}

// ─── Pulse Ring ──────────────────────────────────────────────────────────────

function PulseRing({ delay }: { delay: number }) {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.8,  duration: 1300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,    duration: 1300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{ opacity, transform: [{ scale }] }}
      className="absolute w-32 h-32 rounded-full border border-white/35"
    />
  );
}

// ─── SplashScreen ────────────────────────────────────────────────────────────

export default function SplashScreen({ onFinish }: Props) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale        = useRef(new Animated.Value(0.4)).current;
  const logoOpacity      = useRef(new Animated.Value(0)).current;
  const titleOpacity     = useRef(new Animated.Value(0)).current;
  const titleY           = useRef(new Animated.Value(24)).current;
  const dotsOpacity      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo spring-pop
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      // 2. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
      // 3. Dots appear
      Animated.timing(dotsOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      // 4. Hold
      Animated.delay(900),
      // 5. Fade out
      Animated.timing(containerOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View
      style={{ opacity: containerOpacity, width, height }}
      className="absolute inset-0 z-50"
    >
      <LinearGradient
        colors={BRAND_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width, height }}
        className="items-center justify-center"
      >
        {/* ── Logo + Pulse ── */}
        <View className="w-32 h-32 items-center justify-center">
          <PulseRing delay={0} />
          <PulseRing delay={650} />

          <Animated.View
            style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
            className="w-[88px] h-[88px] rounded-[22px] bg-white/15 border border-white/30 items-center justify-center"
            // elevation / shadow via inline for cross-platform
            // NativeWind doesn't cover shadow* on Android yet
          >
            <ShieldCheck size={42} color="#ffffff" strokeWidth={2} />
          </Animated.View>
        </View>

        {/* ── Brand text ── */}
        <Animated.View
          style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}
          className="mt-7 items-center"
        >
          <Text className="text-[34px] font-extrabold text-white tracking-tight">
            Tracker
          </Text>
          <Text className="text-white/65 text-[13px] mt-1.5 font-medium tracking-wide">
            Logimax · Your workspace, unified.
          </Text>
        </Animated.View>

        {/* ── Loading dots ── */}
        <Animated.View
          style={{ opacity: dotsOpacity }}
          className="flex-row gap-2 mt-10"
        >
          <BouncingDot delay={0} />
          <BouncingDot delay={160} />
          <BouncingDot delay={320} />
        </Animated.View>

        {/* ── Footer eyebrow ── */}
        <View className="absolute bottom-14">
          <Text className="text-white/28 text-[11px] tracking-[2.5px] font-semibold uppercase">
            Loading
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
