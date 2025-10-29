import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
export default function CoffeeCard({item}){ return (
  <View style={{backgroundColor:'#0b0810',padding:12,borderRadius:12,marginBottom:12,shadowColor:'#5b2eff',shadowOpacity:0.4,shadowRadius:8}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
      <View style={{flex:1}}>
        <Text style={{color:'#e9d7ff',fontSize:16,fontWeight:'700'}}>{item.name}</Text>
        <Text style={{color:'#cfc5e8',marginTop:6'}}>{item.desc}</Text>
        <Text style={{color:'#fff',marginTop:8'}}>{item.price} ₽</Text>
      </View>
      <TouchableOpacity style={{marginLeft:12,backgroundColor:'#3b0066',padding:10,borderRadius:8}}>
        <Text style={{color:'#fff'}}>В корзину</Text>
      </TouchableOpacity>
    </View>
  </View>
); }
