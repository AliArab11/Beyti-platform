using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("SellerAddress")]
[Index("AddressId", Name = "IX_SellerAddress_Address")]
[Index("SellerId", Name = "IX_SellerAddress_Seller")]
[Index("SellerId", "AddressId", Name = "UQ_SellerAddress", IsUnique = true)]
public partial class SellerAddress
{
    [Key]
    public int Id { get; set; }

    public int SellerId { get; set; }

    public int AddressId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("SellerAddresses")]
    public virtual Address Address { get; set; } = null!;

    [ForeignKey("SellerId")]
    [InverseProperty("SellerAddresses")]
    public virtual Seller Seller { get; set; } = null!;
}
