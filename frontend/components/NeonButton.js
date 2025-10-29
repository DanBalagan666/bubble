import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
export default function NeonButton({children, onPress}){ return (<TouchableOpacity onPress={onPress} style={{padding:12,backgroundColor:'#2a0057',borderRadius:10}}><Text style={{color:'#fff',textAlign:'center'}}>{children}</Text></TouchableOpacity>); }
