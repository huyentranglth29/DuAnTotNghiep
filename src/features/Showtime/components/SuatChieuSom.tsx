import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MovieBookingInfo} from './MovieName';
import PromoCarousel from './PromoCarousel';

const earlyMovies = [
  {
    title: 'Ma Nữ Oán Tình',
    duration: '105 phút',
    age: 'T18',
    ageColor: '#f47fa2',
    poster: require('../../../assets/showtime/dong-dao-ma-quai.jpg'),
  },
  {
    title: 'Quỷ Bất Hồn',
    duration: '103 phút',
    age: 'T16',
    ageColor: '#f1d83f',
    poster: require('../../../assets/showtime/den-la-sat.jpg'),
  },
];

type SuatChieuSomProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function SuatChieuSom({onMoviePress}: SuatChieuSomProps) {
  return (
    <View style={styles.container}>
      <PromoCarousel />

      <View style={styles.movieGrid}>
        {earlyMovies.map(movie => (
          <TouchableOpacity
            key={movie.title}
            activeOpacity={0.85}
            style={styles.movieCard}
            onPress={() => onMoviePress(movie)}>
            <View style={styles.posterWrap}>
              <Image source={movie.poster} style={styles.moviePoster} />
              <View style={[styles.ageBadge, {backgroundColor: movie.ageColor}]}>
                <Text style={styles.ageText}>{movie.age}</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <Text style={styles.movieDuration}>{movie.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    minHeight: 700,
    paddingBottom: 24,
  },
  movieGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    paddingTop: 18,
  },
  movieCard: {
    width: '31.7%',
  },
  posterWrap: {
    aspectRatio: 0.68,
    borderRadius: 5,
    backgroundColor: '#e9eef3',
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ageBadge: {
    position: 'absolute',
    left: 7,
    top: 7,
    minWidth: 37,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  movieTitle: {
    color: '#242424',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  movieDuration: {
    color: '#9b9b9b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SuatChieuSom;
