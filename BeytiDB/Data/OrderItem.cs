using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("OrderItem")]
[Index("OrderId", Name = "IX_OrderItem_Order")]
[Index("ProductVariantId", Name = "IX_OrderItem_Var")]
public partial class OrderItem
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductVariantId { get; set; }

    public int Qty { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(21, 2)")]
    public decimal? LineTotal { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("OrderItems")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("ProductVariantId")]
    [InverseProperty("OrderItems")]
    public virtual ProductVariant ProductVariant { get; set; } = null!;
}
