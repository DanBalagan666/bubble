import React, {useState, useEffect} from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Image, Linking } from 'react-native';
import axios from 'axios';
import CoffeeCard from '../components/CoffeeCard';
const API = 'https://bubble-coffee.onrender.com/api';
export default function MenuScreen({navigation}){
  const [menu, setMenu] = useState([]);
  useEffect(()=>{ fetchMenu(); },[]);
  const fetchMenu = async ()=>{ try{ const r = await axios.get(`${API}/menu`); setMenu(r.data); }catch(e){ console.log(e); } };
  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#07060a'}}>
      <View style={{padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Image source={require('../assets/logo.png')} style={{width:48,height:48,marginRight:10}} />
          <Text style={{color:'#e9d7ff', fontSize:20, fontWeight:'700'}}>Bubble Coffee</Text>
        </View>
        <View style={{flexDirection:'row'}}>
          <TouchableOpacity onPress={()=>navigation.navigate('Promo')} style={{marginRight:12}}>
            <Text style={{color:'#c7a1ff'}}>Акции</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{ Linking.openURL('https://t.me/+79288338520'); }} style={{marginRight:12}}>
            <Text style={{color:'#c7a1ff'}}>Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>navigation.navigate('Cart')}>
            <Text style={{color:'#c7a1ff'}}>Корзина</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList data={menu} keyExtractor={i=>String(i.id)} renderItem={({item})=> <CoffeeCard item={item} />} contentContainerStyle={{padding:16}} />
    </SafeAreaView>
  );
}
