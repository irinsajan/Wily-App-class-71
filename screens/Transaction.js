import * as React from 'react';
import { View, Text, StyleSheet,TouchableOpacity, Image, Alert, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import firebase from 'firebase/app';
import db from '../config';

export default class Transaction extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedBookId: '',
            scannedStudentId:'',
            buttonState: 'normal',
            transactionMessage: ''
        }
    }

    handleBarCodeScanned = async({type,data}) => {
        if(this.state.buttonState === "BookId"){
            this.setState({
                buttonState: 'normal',
                scanned: true,
                scannedBookId: data
            });
        }
        else if(this.state.buttonState === "StudentId"){
            this.setState({
                buttonState: 'normal',
                scanned: true,
                scannedStudentId: data
            });
        }
    }

    getCameraPermissions = async (id) => {
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions : status === "granted",
            buttonState: id,
            scanned: false
        });
    }

    handleTransaction = async() => {
        var transactionMessage;
        db.collection('books').doc(this.state.scannedBookId).get()
        .then((doc) => {
            var book = doc.data();
            if(book.bookAvailability){
                this.initiateBookIssue();
                transactionMessage = "Book Issued";
                ToastAndroid.show(transactionMessage,ToastAndroid.SHORT);
            }
            else{
                this.initiateBookReturn();
                transactionMessage = "Book Returned";
                ToastAndroid.show(transactionMessage,ToastAndroid.SHORT);
            }
        })

        this.setState({
            transactionMessage: transactionMessage
        })
    }


    initiateBookIssue = async() => {

        db.collection('transactions').add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Issue"
        })

        db.collection('books').doc(this.state.scannedBookId).update({
            'bookAvailability': false
        })

        db.collection('students').doc(this.state.scannedStudentId).update({
            'booksIssued': firebase.firestore.FieldValue.increment(1)
        })

        
        this.setState({
            'scannedBookId': '',
            'scannedStudentId': ''
        })
    }

    initiateBookReturn = async() => {
        db.collection('transactions').add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Return"
        })

        db.collection('books').doc(this.state.scannedBookId).update({
            'bookAvailability': true
        })

        db.collection('students').doc(this.state.scannedStudentId).update({
            'booksIssued': firebase.firestore.FieldValue.increment(-1)
        })

        this.setState({
            'scannedBookId': '',
            'scannedStudentId': ''
        })
    }

    render(){
        if(this.state.buttonState !== 'normal' && this.state.hasCameraPermissions){
            return(
                <BarCodeScanner
                    onBarCodeScanned = {this.state.scanned ? undefined : this.handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            );
        }

        else if (this.state.buttonState === 'normal'){
            return(
                <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>

                    <View>
                        <Image
                            source={require('../assets/booklogo.jpg')}
                            style={{width:200, height:200}}
                        />
                        <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder='Book Id'
                            onChangeText = {(text) => {
                                this.setState({scannedBookId: text});
                            }}
                            value={this.state.scannedBookId}
                        />
                        <TouchableOpacity style={styles.scanButton}
                            onPress = { () => {this.getCameraPermissions("BookId")}}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder='Student Id'
                            onChangeText = {(text) => {
                                this.setState({scannedStudentId: text});
                            }}
                            value={this.state.scannedStudentId}
                        />
                        <TouchableOpacity style={styles.scanButton}
                            onPress = { () => {this.getCameraPermissions("StudentId")}}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                   
                    <TouchableOpacity 
                        style={styles.submitButton}
                        onPress = {() => {this.handleTransaction()}}>
                        <Text style={styles.submitText}>SUBMIT</Text>
                    </TouchableOpacity>                    
                </KeyboardAvoidingView>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    displayText: {
        fontSize: 15,
        textDecorationLine: 'underline'
    },
    scanButton: {
        backgroundColor: '#66BB6A',
        width: 50, 
        borderWidth: 1.5,
        borderLeftWidth: 0
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 15,
        marginTop: 10
    },
    inputView: {
        flexDirection: 'row',
        margin: 20
    },
    inputBox: {
        width: 200,
        height: 50,
        borderWidth: 1.5,
        borderRightWidth: 0,
        fontSize: 20
    },
    submitButton :{
        backgroundColor: '#FBC02D',
        width: 100,
        height: 50
    },
    submitText: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        padding: 10

    }
    
})