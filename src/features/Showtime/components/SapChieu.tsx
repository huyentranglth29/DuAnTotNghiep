import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MovieBookingInfo} from './MovieName';
import PromoCarousel from './PromoCarousel';

const upcomingMovies = [
  {
    title: 'Minions & Quái Vật',
    date: '01-07-2026',
    age: 'P',
    ageColor: '#87c846',
    hot: true,
    poster: require('../../../assets/showtime/minions.jpg'),
  },
  {
    title: 'Đèn La Sát',
    date: '03-07-2026',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: false,
    poster: require('../../../assets/showtime/den-la-sat.jpg'),
  },
  {
    title: 'Đồng Dao Ma Quái',
    date: '03-07-2026',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: false,
    poster: require('../../../assets/showtime/dong-dao-ma-quai.jpg'),
  },
  {
    title: 'Bóng Quỷ',
    date: '03-07-2026',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: false,
    poster: require('../../../assets/showtime/bong-quy.jpg'),
  },
  {
    title: 'Sheep In The Box',
    date: '03-07-2026',
    age: 'T13',
    ageColor: '#5db4e8',
    hot: false,
    poster: require('../../../assets/showtime/sheep-in-the-box.jpg'),
  },
  {
    title: 'Moana',
    date: '03-07-2026',
    age: 'K',
    ageColor: '#f59b2d',
    hot: false,
    poster: require('../../../assets/showtime/moana.jpg'),
  },
];

type SapChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function SapChieu({onMoviePress}: SapChieuProps) {
  return (
    <View style={styles.container}>
      <PromoCarousel />

      <View style={styles.movieGrid}>
        {upcomingMovies.map(movie => (
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
              {movie.hot && (
                <View style={styles.hotRibbon}>
                  <Text style={styles.hotText}>HOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.movieDate}>{movie.date}</Text>
            <Text numberOfLines={2} style={styles.movieTitle}>
              {movie.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingBottom: 18,
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 18,
  },
  movieCard: {
    width: '31.7%',
    marginBottom: 26,
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
  hotRibbon: {
    position: 'absolute',
    right: -27,
    top: 10,
    width: 86,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6d16',
    transform: [{rotate: '45deg'}],
  },
  hotText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  movieDate: {
    color: '#22a8e8',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  movieTitle: {
    color: '#242424',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SapChieu;
