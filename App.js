import React, {Component} from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  ScrollView,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export default class App extends Component<{}> {
  watchId = null;

  state = {
    loading: false,
    updatesEnabled: false,
    location: {},
    getFireBase: null,
  };

  hasLocationPermission = async () => {
    if (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)
    ) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  getLocation = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) return;

    this.setState({loading: true}, () => {
      Geolocation.getCurrentPosition(
        position => {
          this.setState({location: position, loading: false});
          const postToFirebase = this.postLocateFirebase();
          console.log(position);
        },
        error => {
          this.setState({location: error, loading: false});
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 50,
          forceRequestLocation: true,
        },
      );
    });
  };

  getLocationUpdates = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) return;

    this.setState({updatesEnabled: true}, () => {
      this.watchId = Geolocation.watchPosition(
        position => {
          this.setState({location: position});
          console.log(position);
        },
        error => {
          this.setState({location: error});
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 5000,
          fastestInterval: 2000,
        },
      );
    });
  };

  removeLocationUpdates = () => {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.setState({updatesEnabled: false});
    }
  };

  getLocateFirebase = async () => {
    fetch('https://top-gun-team31.firebaseio.com/quiz/location/team31/.json')
      .then(response => response.json())
      .then(responseJson => {
        //  Alert.alert("Author name at 0th index:  " + responseJson);
        this.setState({location: responseJson, loading: false});
      })
      .catch(error => {
        console.error(error);
      });
  };

  postLocateFirebase = async () => {
    var coords = this.state.location.coords;
    var lat = coords.latitude;
    var lng = coords.longitude;
    var d = new Date();
    var tzo = - d.getTimezoneOffset() / 60;
    tzo = (tzo + '').padStart(2, '0');
    d = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    var tsp = d.toISOString();
    tsp = tsp.replace('Z', `+${tzo}:00`);
    fetch('https://top-gun-team31.firebaseio.com/quiz/location/team31/.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team: 31,
        latitude: lat,
        longitude: lng,
        timestamp: tsp
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        this.getLocateFirebase();
        //  Alert.alert("Author name at 0th index:  " + responseJson);
        // this.setState({location: responseJson, loading: false});
      })
      .catch(error => {
        console.error(error);
      });
  };

  render() {
    const {loading, location, updatesEnabled} = this.state;
    return (
     
        <View style={styles.container}>
           <ScrollView>
           {/* <Button
            title="Get Location"
            onPress={this.getLocation}
            disabled={loading || updatesEnabled}
          /> */}
          <View style={styles.buttons}>
            <Button
              title="Post Firebase"
              onPress={() => this.getLocation()}
              disabled={loading || updatesEnabled}
            />
            <Button title="Get Firebase" onPress={this.getLocateFirebase} />
          </View>
          {/* <View style={styles.buttons}>
          <Button
            title="Start Observing"
            onPress={this.getLocationUpdates}
            disabled={updatesEnabled}
          />
          <Button
            title="Stop Observing"
            onPress={this.removeLocationUpdates}
            disabled={!updatesEnabled}
          />
        </View> */}

          <View style={styles.result}>
            <Text>{JSON.stringify(location, null, 4)}</Text>
          </View>
           </ScrollView>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingHorizontal: 12,
  },
  result: {
    borderWidth: 1,
    borderColor: '#666',
    width: '100%',
    paddingHorizontal: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
});

//  export default App;
